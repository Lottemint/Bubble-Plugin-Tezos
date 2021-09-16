function(properties, context) {

    let constants = {
        currency: {
            tezos: {
                id: 'tezos',
                symbol: 'ꜩ'
            }
        },
        errorMessages: {
            noNetwork: {
                id: 'noNetwork',
                message: 'Empty network. Please provide your preferred RPC URL.'
            },
            noAddress: {
                id: 'noAddress',
                message: 'Empty address.'
            },
            unexpectedError: {
                id: 'unexpectedError',
                message: 'Unexpected Error. 🐛'
            }
        },
        nodes: {
            mainnet: {
                id: 'mainnet',
                url: 'https://mainnet.api.tez.ie'
            },
            florencenet: {
                id: 'florencenet',
                url: 'https://florencenet.api.tez.ie'
            }
        },
        walletNetworks: {
            mainnet: {
                id: 'mainnet'
            },
            florencenet: {
                id: 'florencenet'
            }
        }
    };

    try {

        let {walletNetwork, walletNetworkDynamic} = properties;
        let walletNetwork_;

        if (typeof walletNetwork === 'string') walletNetwork = walletNetwork.trim();
        if (typeof walletNetworkDynamic === 'string') walletNetworkDynamic = walletNetworkDynamic.trim();

        if (walletNetworkDynamic && walletNetworkDynamic !== '') {

            walletNetwork_ = walletNetworkDynamic;
        } else if (walletNetwork && walletNetwork !== '') {

            walletNetwork_ = walletNetwork
        }

        if (!walletNetwork_ || walletNetwork_ === '') {

            throw new Error(`Please attach the "walletNetwork." It should be not empty.`)
        }


        let validNetworks = Object.values(constants.walletNetworks).map(cell => cell.id);


        if (!validNetworks.includes(walletNetwork_)) {

            throw new Error(`Selected walletNetwork "${walletNetwork_}" is not valid. Valid walletNetworks: ${validNetworks.join(', ')}.`)
        }


        let node = constants.nodes[walletNetwork_];

        let rpcUrl;

        if (node.url) rpcUrl = node.url;

        if (!rpcUrl) throw new Error(constants.errorMessages.noNetwork.message);


        const {TezosToolkit} = require('@taquito/taquito');
        const Tezos = new TezosToolkit(rpcUrl);
        const deasync = require('deasync');


        let done = false, resultNumber, resultText, errorMessage;

        let {tzAddress} = properties;

        if (typeof tzAddress === 'string') tzAddress = tzAddress.trim();
        if (typeof tzAddress !== 'string' || (typeof tzAddress === 'string' && tzAddress === '')) throw new Error(constants.errorMessages.noAddress.message);


        Tezos.tz
            .getBalance(tzAddress)
            .then((balance) => {

                resultNumber = balance.toNumber() / 1000000;
                resultText = `${resultNumber} ${constants.currency.tezos.symbol}`;
                done = true
            })
            .catch((error) => {

                errorMessage = error ? error.message ? error.message : error : constants.errorMessages.unexpectedError.message;
                done = true
            });


        deasync.loopWhile(() => {

            return !done
        });

        if (errorMessage && typeof errorMessage !== 'string') errorMessage = JSON.stringify(errorMessage);
        if (resultText && typeof resultText !== 'string') resultText = JSON.stringify(resultText);
        if (resultNumber && typeof resultNumber !== 'number') resultNumber = null;


        return {
            resultNumber: resultNumber,
            resultText: resultText,
            errorMessage: errorMessage,
        }

    } catch (e) {

        return {
            errorMessage: e.message
        }
    }
}