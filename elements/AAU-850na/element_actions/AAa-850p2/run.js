function(instance, properties, context) {

    if (instance.data.initialized !== true) return;

    instance.data.resetConnectStates();

    let constants = instance.data.constants;

    try {


        let {TezosToolkit} = window.taquito;
        let {BeaconWallet} = window.taquitoBeaconWallet;

        let {appName, appIcon, walletNetwork, walletNetworkDynamic} = properties;
        let walletNetwork_;

        if (typeof appName === 'string') appName = appName.trim();
        if (typeof appName !== 'string') appName = '-';

        // if (typeof appIcon === 'string') appIcon = appIcon.trim();
        // if (typeof appIcon !== 'string') appIcon = '-';

        if (typeof walletNetwork === 'string') walletNetwork = walletNetwork.trim();
        if (typeof walletNetworkDynamic === 'string') walletNetworkDynamic = walletNetworkDynamic.trim();

        if (walletNetworkDynamic && walletNetworkDynamic !== '') {

            walletNetwork_ = walletNetworkDynamic;
        } else if (walletNetwork && walletNetwork !== '') {

            walletNetwork_ = walletNetwork
        }

        if (!walletNetwork_ || walletNetwork_ === '') {

            throw new Error(constants.errorMessages.noNetworkType.message)
        }


        let validNetworks = Object.values(constants.walletNetworks).map(cell => cell.id);


        if (!validNetworks.includes(walletNetwork_)) {

            throw new Error(constants.errorMessages.wrongNetwork.message(walletNetwork_, validNetworks))
        }

        let rpcUrl = instance.data[`${constants.justThings.rpcUrl}${instance.data.capitalizeString(walletNetwork_)}`];


        if (typeof rpcUrl === 'string' && rpcUrl) {

            rpcUrl = rpcUrl.replace(/(^\w+:|^)\/\//, '');
            rpcUrl = `${constants.justThings.https}${rpcUrl}`
        }

        
        instance.data.rpcUrl = rpcUrl;

        instance.data.Tezos = new TezosToolkit(rpcUrl);


        let options = {
            name: appName,
            preferredNetwork: walletNetwork_,
            // iconUrl: "https://assets.tqtezos.com/img/tezos/logo-tezos.svg"
        };

        let wallet;

        if (window.BeaconWalletInitialized && typeof window.BeaconWalletInitialized.client === 'object') {

            wallet = window.BeaconWalletInitialized;
            if (typeof window.BeaconWalletInitialized.client.name === 'string') window.BeaconWalletInitialized.client.name = appName;
        } else {

            wallet = new BeaconWallet(options);
            window.BeaconWalletInitialized = wallet;
        }

        instance.data.wallet = wallet;
        instance.data.walletNetwork = walletNetwork_;

        let userAddress;

        wallet.requestPermissions({
            network: {
                type: walletNetwork_,
                rpcUrl: rpcUrl
            },
        }).then(result => {

            wallet.getPKH().then(result_ => {

                userAddress = result_;
                instance.data.userAddress = userAddress;
                instance.publishState(constants.states.userAddress.id, userAddress);

                instance.data.Tezos.setWalletProvider(instance.data.wallet)

            }).catch(e => {

                instance.data.publishError(e, constants.methods.connect.id)

            })
        }).catch(e => {

            instance.data.publishError(e, constants.methods.connect.id)
        });

    } catch (e) {

        instance.data.publishError(e, constants.methods.connect.id)
    }


}