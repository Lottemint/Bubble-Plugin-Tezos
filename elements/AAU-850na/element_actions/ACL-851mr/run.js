function(instance, properties, context) {

    let {Tezos, constants} = instance.data;

    try {

        let walletRequired = instance.data.walletRequired();

        if (walletRequired.error) {

            throw new Error(walletRequired.errorMessage)
        }

        instance.data.resetContractStates();

        instance.data.contractRandomId = instance.data.generateId(10);

        let contractRandomId_ = instance.data.contractRandomId;
        let checkIfRelevant = () => {

            return instance.data.contractRandomId === contractRandomId_
        };

        instance.publishState(constants.states.contractStatus.id, constants.methods.createContract.statuses.pending.id);

        Tezos.wallet
            .originate({
                code: instance.data.constants.genericMultisigFile,
                storage: {
                    stored_counter: 0,
                    threshold: 0,
                    keys: []
                },
            })
            .send()
            .then((originationOp) => {

                if (!checkIfRelevant()) return;

                instance.publishState(constants.states.contractStatusMessage.id, constants.methods.createContract.messages.pending());
                return originationOp.contract()
            })
            .then((contract) => {

                if (!checkIfRelevant()) return;

                instance.publishState(constants.states.contractStatusMessage.id, constants.methods.createContract.messages.completed(contract.address));
                instance.publishState(constants.states.contractAddress.id, contract.address);
                instance.publishState(constants.states.contractStatus.id, constants.methods.createContract.statuses.completed.id);

                let urls = constants.urls.tzExplorer[instance.data.walletNetwork];

                instance.publishState(constants.states.contractURL.id, `${urls.browser}${contract.address}/${constants.tzExplorerAPI.types.operations.id}`);
                instance.publishState(constants.states.contractURLAPI.id, `${urls.api}${constants.tzExplorerAPI.types.contracts.id}/${contract.address}`)

            })
            .catch((error) => {

                if (!checkIfRelevant()) return;

                instance.data.publishError(`Error: ${JSON.stringify(error, null, 2)}`, constants.methods.createContract.id);
                instance.publishState(constants.states.contractStatus.id, constants.methods.createContract.statuses.error.id)
            });

    } catch (e) {

        instance.data.publishError(e, constants.methods.createContract.id);
        instance.publishState(constants.states.contractStatus.id, constants.methods.createContract.statuses.error.id)
    }
}