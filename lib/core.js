const { CONFIG } = require('./config')
const { PATHS, ERRORS, AUTH_METHODS, ENVIRONMENT } = require('./consts')
const { HttpClient } = require('./http-client')

/**
 * @typedef {string} KYCStatus
 * @description KYC Status | Description
 * :--------- | :----------
 * Pending | Waiting on user to provide documents for verification
 * Completed | User has provided documents and is waiting to be verified
 * Passed | User was successfully verified
 * Rejected | User has failed verification
 */

/**
 * @typedef {object} BalanceResponse
 * @description Contains balances for all supported coins.
 */

/**
 * @typedef {Object} Pagination
 * @property {number} page - Which page will be returned
 * @property {number} perPage - Number of results to be returned per page
 */

/**
 * @typedef {Object} FormFields
 * @property {string} address - Address where funds need to be sent
 * @property {number} amount
 */

/**
 * @typedef {Object} Documents
 * @property {string} document_front_image
 * @property {string} document_back_image
 */

/**
 * @typedef {Object} UserData
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} date_of_birth
 * @property {string} citizenship
 * @property {string} middle_name
 * @property {string} title
 * @property {string} gender
 * @property {string} phone_number
 * @property {string} document_type
 */

/**
 * @typedef {object} Celsius
 * @property {function} getKycStatus - Method for sending GET requests
 * @property {function} verifyKyc - Method for sending POST requests. Data is transmitted using multipart/form-data
 */

/**
 * Celsius js SDK Core
 * @module celsius-js-sdk/core
 */
/**
 * @description Creates and configures Core.
 *
 * @function
 * @param {object} config - Config has partner key, auth method and user secret.
 *
 * @returns {Celsius}
 */
const Celsius = function (config) {
  let defaultConfig = CONFIG[config.environment]
  if (!defaultConfig) {
    defaultConfig = CONFIG[ENVIRONMENT.PRODUCTION]
  }
  config = Object.assign({}, defaultConfig, config)

  if (config.authMethod !== AUTH_METHODS.API_KEY && config.authMethod !== AUTH_METHODS.USER_TOKEN) {
    throw new Error(ERRORS.INVALID_AUTH_METHOD)
  }

  if (!config.partnerKey) {
    throw new Error(ERRORS.INVALID_PARTNER_KEY)
  }

  const httpClient = HttpClient(config)

  return {

    /**
     * Returns KYC status for the given user.
     * If partner authenticates users via api-keys, status returned will always be Passed because users are required to
     * pass KYC before creating api keys.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function getKycStatus
     * @param userSecret {string} - Represents a secret value used to uniquely identify users. Can be user-token or api-key
     *
     * @returns {KYCStatus}
     * @returns {Error}
     */
    getKycStatus: function (userSecret) {
      return httpClient.get(PATHS.KYC, null, userSecret)
    },

    /**
     * Returns current balance for the given user.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function verifyKyc
     * @param userSecret {string} - Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     * @param userData {UserData} - Represents user's personal information.
     * @param documents {Documents} - Images of user's documents.
     *
     * @returns {string} Ok
     * @returns {error}
     */
    verifyKyc: function (userData, documents, userSecret) {
      return httpClient.post(PATHS.KYC, userData, documents, userSecret)
    },

    /**
     * Returns balance for the given user.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function getBalanceSummary
     * @param userSecret {string} - Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     * @returns {BalanceResponse} - Contains balances for all currencies.
     */
    getBalanceSummary: function (userSecret) {
      return httpClient.get(PATHS.BALANCE_SUMMARY, null, userSecret)
    },

    /**
     * Returns balance of a single coin for the given user.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function getCoinBalance
     * @param userSecret {string} - Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     * @param coin {string} - Coin for which to get balance.
     *
     * @returns {BalanceForCoinResponse} Contains balances for a single coin (in that coin and in usd).
     * @return {Error}
     */
    getCoinBalance: function (coin, userSecret) {
      return httpClient.get(PATHS.COIN_BALANCE(coin), null, userSecret)
    },

    /**
     * Returns paginated transactions of a user.
     * Also included in the response is a {PaginationHeader}, used to get next chunk of transactions.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function getTransactionSummary
     * @param userSecret {string} - Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     * @param pagination {PaginationConfig} - Pagination configuration (Which page to get and how many results per page).
     *
     * @return {TransactionResponse} - Response contains a pagination header and an array of transactions.
     * @return {Error}
     */
    getTransactionSummary: function (pagination, userSecret) {
      return httpClient.get(PATHS.TRANSACTIONS_SUMMARY, pagination, userSecret)
    },

    /**
     * Returns paginated transactions of a user for the specified coin.
     * Also included in the response is a {PaginationHeader}, used to get next chunk of transactions.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function getCoinTransactions
     * @param userSecret {string} -  Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     * @param pagination {PaginationConfig} - Pagination configuration (Which page to get and how many results per page).
     * @param coin {string} - Coin for which to get transactions.
     *
     * @returns {TransactionResponse} - Response contains a pagination header and an array of transactions.
     * @return {Error}
     */
    getCoinTransactions: function (coin, pagination, userSecret) {
      return httpClient.get(PATHS.COIN_TRANSACTIONS(coin), pagination, userSecret)
    },

    /**
     * Returns deposit address of a user's wallet for the specified coin.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function getDeposit
     * @param userSecret {string} Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     * @param coin {string} Coin for which to get deposit address.
     *
     * @returns {string} Deposit address.
     * @returns {Error}
     */
    getDeposit: function (coin, userSecret) {
      return httpClient.get(PATHS.DEPOSIT(coin), null, userSecret)
    },

    /**
     * Withdraws the specified amount to the provided address.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function withdraw
     * @param coin {string} - For witch coin to perform the withdrawal.
     * @param formFields {WithdrawalFields} - Contains amount to withdraw and and address that amount is to be withdrawn to.
     * @param userSecret {string} Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     *
     * @returns {string} Transaction id.
     * @returns {Error}
     */
    withdraw: function (coin, formFields, userSecret) {
      return httpClient.post(PATHS.WITHDRAW(coin), formFields, null, userSecret)
    },

    /**
     * This method returns transaction status for specific transaction.
     *
     * @memberOf module:celsius-js-sdk/core
     * @function getTransactionsStatus
     * @param userSecret {string} Represents a secret value used to uniquely identify users. Can be user-token or api-key.
     * @param transaction {string} Id of transaction.
     *
     * @returns {TransactionStatus} Transaction status
     * @returns {Error}
     */
    getTransactionStatus: function (transaction, userSecret) {
      return httpClient.get(PATHS.TRANSACTION_STATUS(transaction), null, userSecret)
    }
  }
}

module.exports = {
  Celsius
}
