function(instance, context) {

    instance.data.initialized = true;

    let constants = {
        methods: {
            connect: {
                id: 'connect'
            },
            transfer: {
                id: 'transfer',
                statuses: {
                    pending: {
                        id: 'pending'
                    },
                    completed: {
                        id: 'completed'
                    },
                    error: {
                        id: 'error'
                    }
                }
            },
            createContract: {
                id: 'createContract',
                messages: {
                    pending: () => {

                        return `Waiting for confirmation of origination...`
                    },
                    completed: (address) => {

                        return `Origination completed for ${address}.`
                    }
                },
                statuses: {
                    pending: {
                        id: 'pending'
                    },
                    completed: {
                        id: 'completed'
                    },
                    error: {
                        id: 'error'
                    }
                }
            }
        },
        states: {
            errorMessage: {
                id: 'errorMessage'
            },
            userAddress: {
                id: 'userAddress'
            },
            transferAddressTarget: {
                id: 'transferAddressTarget'
            },
            transferAddressSender: {
                id: 'transferAddressSender'
            },
            transferAmount: {
                id: 'transferAmount'
            },
            transferStatus: {
                id: 'transferStatus'
            },
            transferId: {
                id: 'transferId'
            },
            transferErrorMessage: {
                id: 'transferErrorMessage'
            },
            transferURL: {
                id: 'transferURL'
            },
            transferURLAPI: {
                id: 'transferURLAPI'
            },
            contractStatus: {
                id: 'contractStatus'
            },
            contractStatusMessage: {
                id: 'contractStatusMessage'
            },
            contractAddress: {
                id: 'contractAddress'
            },
            contractErrorMessage: {
                id: 'contractErrorMessage'
            },
            contractURL: {
                id: 'contractURL'
            },
            contractURLAPI: {
                id: 'contractURLAPI'
            },
        },
        currency: {
            tezos: {
                id: 'tezos',
                symbol: 'ꜩ'
            }
        },
        errorMessages: {
            noNetwork: {
                id: 'noNetwork',
                message: 'Empty network. Please provide your preferred RPC URL in the plugin settings.'
            },
            wrongNetwork: {
                id: 'noNetworkType',
                message: (walletNetwork, validNetworks) => {

                    return `Selected walletNetwork "${walletNetwork}" is not valid. Valid walletNetworks: ${validNetworks.join(', ')}.`
                }
            },
            noNetworkType: {
                id: 'noNetworkType',
                message: 'Please attach the "walletNetwork." It should be not empty.'
            },
            noWallet: {
                id: 'noWallet',
                message: 'The "wallet" is empty. Please connect your wallet first.'
            },
            unexpectedError: {
                id: 'unexpectedError',
                message: 'Unexpected Error. 🐛'
            },
            noAddress: {
                id: 'noAddress',
                message: 'Empty address.'
            },
            transferNoAddress: {
                id: 'transferNoAddress',
                message: 'The "address" should not be empty.'
            },
            transferNoAmount: {
                id: 'transferNoAmount',
                message: 'The "amount" should not be empty.'
            },
            transferLowAmount: {
                id: 'transferLowAmount',
                message: 'The "amount" should be greater than 0.'
            }
        },
        walletNetworks: {
            mainnet: {
                id: 'mainnet'
            },
            florencenet: {
                id: 'florencenet'
            }
        },
        tzExplorerAPI: {
            types: {
                operations: {
                    id: 'operations'
                },
                contracts: {
                    id: 'contracts'
                }
            }
        },
        urls: {
            tzExplorer: {
                mainnet: {
                    browser: 'https://tzkt.io/',
                    api: 'https://api.tzkt.io/v1/',
                },
                florencenet: {
                    browser: 'https://florencenet.tzkt.io/',
                    api: 'https://api.florencenet.tzkt.io/v1/',
                }
            },
            taquitoMin: {
                lookBy: 'taquito',
                url: '//dd7tel2830j4w.cloudfront.net/f1631545961942x732164026614377200/taquito.min.js',
                responseType: 'script'
            },
            taquitoBeaconWallet: {
                lookBy: 'taquitoBeaconWallet',
                url: '//dd7tel2830j4w.cloudfront.net/f1631546149510x577893219564137700/taquito-beacon-wallet.umd.js',
                responseType: 'script'
            },
            walletbeaconMin: {
                lookBy: 'beacon',
                url: '//dd7tel2830j4w.cloudfront.net/f1631546213293x144545675285623780/walletbeacon.min.js',
                responseType: 'script'
            }
        },
        justThings: {
            rpcUrl: 'rpcUrl',
            https: 'https://'
        },
        genericMultisigFile: `parameter (or (unit %default)
              (pair %main
                 (pair :payload
                    (nat %counter) # counter, used to prevent replay attacks
                    (or :action    # payload to sign, represents the requested action
                       (lambda %operation unit (list operation))
                       (pair %change_keys          # change the keys controlling the multisig
                          (nat %threshold)         # new threshold
                          (list %keys key))))     # new list of keys
                 (list %sigs (option signature))));    # signatures

storage (pair (nat %stored_counter) (pair (nat %threshold) (list %keys key))) ;

code
  {
    UNPAIR ;
    IF_LEFT
      { # Default entry point: do nothing
        # This entry point can be used to send tokens to this contract
        DROP ; NIL operation ; PAIR }
      { # Main entry point
        # Assert no token was sent:
        # to send tokens, the default entry point should be used
        PUSH mutez 0 ; AMOUNT ; ASSERT_CMPEQ ;
        SWAP ; DUP ; DIP { SWAP } ;
        DIP
          {
            UNPAIR ;
            # pair the payload with the current contract address, to ensure signatures
            # can't be replayed accross different contracts if a key is reused.
            DUP ; SELF ; ADDRESS ; CHAIN_ID ; PAIR ; PAIR ;
            PACK ; # form the binary payload that we expect to be signed
            DIP { UNPAIR @counter ; DIP { SWAP } } ; SWAP
          } ;

        # Check that the counters match
        UNPAIR @stored_counter; DIP { SWAP };
        ASSERT_CMPEQ ;

        # Compute the number of valid signatures
        DIP { SWAP } ; UNPAIR @threshold @keys;
        DIP
          {
            # Running count of valid signatures
            PUSH @valid nat 0; SWAP ;
            ITER
              {
                DIP { SWAP } ; SWAP ;
                IF_CONS
                  {
                    IF_SOME
                      { SWAP ;
                        DIP
                          {
                            SWAP ; DIIP { DUUP } ;
                            # Checks signatures, fails if invalid
                            { DUUUP; DIP {CHECK_SIGNATURE}; SWAP; IF {DROP} {FAILWITH} };
                            PUSH nat 1 ; ADD @valid } }
                      { SWAP ; DROP }
                  }
                  {
                    # There were fewer signatures in the list
                    # than keys. Not all signatures must be present, but
                    # they should be marked as absent using the option type.
                    FAIL
                  } ;
                SWAP
              }
          } ;
        # Assert that the threshold is less than or equal to the
        # number of valid signatures.
        ASSERT_CMPLE ;
        # Assert no unchecked signature remains
        IF_CONS {FAIL} {} ;
        DROP ;

        # Increment counter and place in storage
        DIP { UNPAIR ; PUSH nat 1 ; ADD @new_counter ; PAIR} ;

        # We have now handled the signature verification part,
        # produce the operation requested by the signers.
        IF_LEFT
          { # Get operation
            UNIT ; EXEC
          }
          {
            # Change set of signatures
            DIP { CAR } ; SWAP ; PAIR ; NIL operation
          };
        PAIR }
  }`
    };
    instance.data.constants = constants;


    let publishError = (error, method) => {

        let errorMessage = error.message;

        if (typeof errorMessage !== 'string') errorMessage = JSON.stringify(errorMessage);
        if (typeof errorMessage === 'string') errorMessage = errorMessage.trim();

        if (!method) method = constants.methods.connect.id;

        let stateName, stateTwoName;
        let stateTwoValue;

        if (method === constants.methods.connect.id) {

            stateName = constants.states.errorMessage.id
        } else if (method === constants.methods.transfer.id) {

            stateName = constants.states.transferErrorMessage.id;
            stateTwoName = constants.states.transferStatus.id;
            stateTwoValue = constants.methods.transfer.statuses.error.id
        } else if (method === constants.methods.createContract.id) {

            stateName = constants.states.contractErrorMessage.id
        }

        instance.publishState(stateName, errorMessage);
        if (stateTwoName && stateTwoValue) instance.publishState(stateTwoName, stateTwoValue)
    };
    instance.data.publishError = publishError;


    let resetConnectStates = () => {

        instance.publishState(constants.states.errorMessage.id, null);
        instance.publishState(constants.states.userAddress.id, null);
    };
    instance.data.resetConnectStates = resetConnectStates;

    let resetTransferStates = () => {

        instance.publishState(constants.states.transferAddressSender.id, null);
        instance.publishState(constants.states.transferAddressTarget.id, null);
        instance.publishState(constants.states.transferAmount.id, null);
        instance.publishState(constants.states.transferStatus.id, null);
        instance.publishState(constants.states.transferId.id, null);
        instance.publishState(constants.states.transferErrorMessage.id, null);
        instance.publishState(constants.states.transferURL.id, null);
        instance.publishState(constants.states.transferURLAPI.id, null);
    };
    instance.data.resetTransferStates = resetTransferStates;

    let resetContractStates = () => {

        instance.publishState(constants.states.contractStatus.id, null);
        instance.publishState(constants.states.contractStatusMessage.id, null);
        instance.publishState(constants.states.contractErrorMessage.id, null);
        instance.publishState(constants.states.contractAddress.id, null);
    };
    instance.data.resetContractStates = resetContractStates;


    $.customLoadFile = (url, type, callback) => {

        $.ajax({
            url: url,
            dataType: type,
            success: callback,
            async: true,
            cache: true
        })
    };


    if (!window[constants.urls.taquitoMin.lookBy]) {

        $.customLoadFile(constants.urls.taquitoMin.url, constants.urls.taquitoMin.responseType, () => {
        });
    }
    if (!window[constants.urls.walletbeaconMin.lookBy]) {

        $.customLoadFile(constants.urls.walletbeaconMin.url, constants.urls.walletbeaconMin.responseType, () => {

            if (!window.beaconSdk) window.beaconSdk = window.beacon;

            if (!window[constants.urls.taquitoBeaconWallet.lookBy]) {

                $.customLoadFile(constants.urls.taquitoBeaconWallet.url, constants.urls.taquitoBeaconWallet.responseType, () => {
                });
            }
        });
    }


    let disconnectWallet = () => {

        if (instance.data.initialized !== true) return;

        if (!instance.data.wallet) return;

        try {

            instance.data.wallet.clearActiveAccount().then().catch();

            instance.data.resetConnectStates();
            instance.data.resetTransferStates();

            delete instance.data.wallet

        } catch (e) {

        }
    };
    instance.data.disconnectWallet = disconnectWallet;

    let handleProps = (props) => {

        let {rpcUrlMainnet, rpcUrlFlorencenet} = props;
        let rpcUrlMainnet_ = instance.data.rpcUrlMainnet;
        let rpcUrlFlorencenet_ = instance.data.rpcUrlFlorencenet;

        let requiresHardReset = false;

        if (rpcUrlMainnet_ || rpcUrlFlorencenet_) {

            requiresHardReset = true;
        }

        if (requiresHardReset) {

            //TODO: add code here :)
        }

        instance.data.rpcUrlMainnet = rpcUrlMainnet;
        instance.data.rpcUrlFlorencenet = rpcUrlFlorencenet
    };
    instance.data.handleProps = handleProps;

    let capitalizeString = (str) => {
        const lower = str.toLowerCase();
        return str.charAt(0).toUpperCase() + lower.slice(1)
    };
    instance.data.capitalizeString = capitalizeString;

    let generateId = (length) => {

        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;

        for (let i = 0; i < length; i++) {

            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }

        return result
    };
    instance.data.generateId = generateId;

    let walletRequired = () => {


        if (instance.data.initialized === true && instance.data.wallet) {

            return {
                error: false,
                errorMessage: null
            }
        } else {

            return {
                error: true,
                errorMessage: constants.errorMessages.noWallet.message
            }
        }
    };
    instance.data.walletRequired = walletRequired;

    let deleteWallet = () => {

        if (window.BeaconWalletInitialized) {

            if (typeof window.BeaconWalletInitialized.disconnect === 'function') {

                window.BeaconWalletInitialized.disconnect()
                    .then(() => {

                        delete window.BeaconWalletInitialized
                    })
                    .catch(() => {

                        delete window.BeaconWalletInitialized
                    })
            }
        }

        delete instance.data.wallet
    };

    let resetConnect = () => {

        resetConnectStates();
        delete instance.data.rpcUrl;
        delete instance.data.Tezos;

        deleteWallet();
        delete instance.data.walletNetwork;
        delete instance.data.userAddress
    };
    instance.data.resetConnect = resetConnect;

    let resetTransfer = () => {

        delete instance.data.transferRandomId;
        resetTransferStates()
    };
    instance.data.resetTransfer = resetTransfer;

    let resetContract = () => {

        delete instance.data.contractRandomId;
        resetContractStates()
    };
    instance.data.resetContract = resetContract;

    let resetFA2Transfer = () => {
    };
    instance.data.resetFA2Transfer = resetFA2Transfer;

    let fullReset = () => {

        resetConnect();
        resetTransfer();
        resetContract();
        resetFA2Transfer()
    };
    instance.data.fullReset = fullReset
}