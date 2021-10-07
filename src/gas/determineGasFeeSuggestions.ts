import { sequenceStrategies } from '../util';
import {
  GAS_ESTIMATE_TYPES,
  EstimatedGasFeeTimeBounds,
  EthGasPriceEstimate,
  GasFeeEstimates,
  GasFeeState as GasFeeSuggestions,
  LegacyGasPriceEstimate,
} from './GasFeeController';

/**
 * Obtains a set of max base and priority fee estimates along with time estimates so that we
 * can present them to users when they are sending transactions or making swaps.
 *
 * @param args - The arguments.
 * @param args.isEIP1559Compatible - Governs whether or not we can use an EIP-1559-only method to
 * produce estimates.
 * @param args.isLegacyGasAPICompatible - Governs whether or not we can use a non-EIP-1559 method to
 * produce estimates (for instance, testnets do not support estimates altogether).
 * @param args.fetchGasEstimates - A function that fetches gas estimates using an EIP-1559-specific
 * API.
 * @param args.fetchGasEstimatesUrl - The URL for the API we can use to obtain EIP-1559-specific
 * estimates.
 * @param args.fetchLegacyGasPriceEstimates - A function that fetches gas estimates using an
 * non-EIP-1559-specific API.
 * @param args.fetchLegacyGasPriceEstimatesUrl - The URL for the API we can use to obtain
 * non-EIP-1559-specific estimates.
 * @param args.fetchEthGasPriceEstimate - A function that fetches gas estimates using
 * `eth_gasPrice`.
 * @param args.calculateTimeEstimate - A function that determine time estimate bounds.
 * @param args.clientId - An identifier that an API can use to know who is asking for estimates.
 * @param args.ethQuery - An EthQuery instance we can use to talk to Ethereum directly.
 * @returns The gas fee suggestions.
 */
export default async function determineGasFeeSuggestions({
  isEIP1559Compatible,
  isLegacyGasAPICompatible,
  fetchGasEstimates,
  fetchGasEstimatesUrl,
  fetchLegacyGasPriceEstimates,
  fetchLegacyGasPriceEstimatesUrl,
  fetchEthGasPriceEstimate,
  calculateTimeEstimate,
  clientId,
  ethQuery,
}: {
  isEIP1559Compatible: boolean;
  isLegacyGasAPICompatible: boolean;
  fetchGasEstimates: (
    url: string,
    clientId?: string,
  ) => Promise<GasFeeEstimates>;
  fetchGasEstimatesUrl: string;
  fetchLegacyGasPriceEstimates: (
    url: string,
    clientId?: string,
  ) => Promise<LegacyGasPriceEstimate>;
  fetchLegacyGasPriceEstimatesUrl: string;
  fetchEthGasPriceEstimate: (ethQuery: any) => Promise<EthGasPriceEstimate>;
  calculateTimeEstimate: (
    maxPriorityFeePerGas: string,
    maxFeePerGas: string,
    gasFeeEstimates: GasFeeEstimates,
  ) => EstimatedGasFeeTimeBounds;
  clientId: string | undefined;
  ethQuery: any;
}): Promise<GasFeeSuggestions> {
  const strategies = [];

  if (isEIP1559Compatible) {
    strategies.push(async () => {
      const estimates = await fetchGasEstimates(fetchGasEstimatesUrl, clientId);
      const {
        suggestedMaxPriorityFeePerGas,
        suggestedMaxFeePerGas,
      } = estimates.medium;
      const estimatedGasFeeTimeBounds = calculateTimeEstimate(
        suggestedMaxPriorityFeePerGas,
        suggestedMaxFeePerGas,
        estimates,
      );
      return {
        gasFeeEstimates: estimates,
        estimatedGasFeeTimeBounds,
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      };
    });
  } else if (isLegacyGasAPICompatible) {
    strategies.push(async () => {
      const estimates = await fetchLegacyGasPriceEstimates(
        fetchLegacyGasPriceEstimatesUrl,
        clientId,
      );
      return {
        gasFeeEstimates: estimates,
        estimatedGasFeeTimeBounds: {},
        gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
      };
    });
  }

  strategies.push(async () => {
    const estimates = await fetchEthGasPriceEstimate(ethQuery);
    return {
      gasFeeEstimates: estimates,
      estimatedGasFeeTimeBounds: {},
      gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
    };
  });

  const runStrategies = sequenceStrategies(
    strategies,
    'Could not generate gas fee suggestions',
  );

  return runStrategies();
}
