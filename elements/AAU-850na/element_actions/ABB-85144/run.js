function(instance, properties, context) {

    let {Tezos, constants} = instance.data;

    try {

        let walletRequired = instance.data.walletRequired();

        if (walletRequired.error) {

            throw new Error(walletRequired.errorMessage)
        }

        instance.data.resetTransferStates();

        let {address, amount} = properties;
        let transferStatuses = constants.methods.transfer.statuses;

        instance.data.transferRandomId = instance.data.generateId(10);

        instance.publishState(constants.states.transferStatus.id, transferStatuses.pending.id);
        instance.publishState(constants.states.transferAddressTarget.id, address);
        instance.publishState(constants.states.transferAddressSender.id, instance.data.userAddress);
        instance.publishState(constants.states.transferAmount.id, amount);


        if (!instance.data.wallet) {

            throw new Error(constants.errorMessages.noWallet.message)
        }

        if (typeof address === 'string') address = address.trim();
        if (!address || address === '') throw new Error(constants.errorMessages.transferNoAddress.message);

        if (isNaN(amount) || !amount) throw new Error(constants.errorMessages.transferNoAmount.message);
        if (amount <= 0) throw new Error(constants.errorMessages.transferLowAmount.message);


        let publishUrl = (hash, type) => {

            let urls = constants.urls.tzExplorer[instance.data.walletNetwork];
            if (type === 1) instance.publishState(constants.states.transferURL.id, `${urls.browser}${hash}`);
            if (type === 2) instance.publishState(constants.states.transferURLAPI.id, `${urls.api}${constants.tzExplorerAPI.types.operations.id}/${hash}`)
        };

        let transferRandomId_ = instance.data.transferRandomId;
        let checkIfRelevant = () => {

            return instance.data.transferRandomId === transferRandomId_
        };

        Tezos.wallet
            .transfer({
                to: address,
                amount: amount
            })
            .send()
            .then((op) => {

                if (!checkIfRelevant()) return;

                let hash = op.opHash;

                instance.publishState(constants.states.transferId.id, hash);
                publishUrl(hash, 1);

                op.confirmation()
                    .then((result) => {

                        if (!checkIfRelevant()) return;

                        if (result.completed) {

                            instance.publishState(constants.states.transferStatus.id, transferStatuses.completed.id)
                        } else {

                            instance.data.publishError(constants.errorMessages.unexpectedError.message, constants.methods.transfer.id)
                        }

                        publishUrl(hash, 2)
                    })
                    .catch((e) => {

                        if (!checkIfRelevant()) return;

                        instance.data.publishError(e, constants.methods.transfer.id);

                        publishUrl(hash, 2)
                    });
            }).catch((e) => {

            if (!checkIfRelevant()) return;

            instance.data.publishError(e, constants.methods.transfer.id)
        });

    } catch (e) {

        instance.data.publishError(e, constants.methods.transfer.id)
    }

}