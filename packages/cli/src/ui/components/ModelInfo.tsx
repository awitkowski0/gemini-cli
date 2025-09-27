/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';

export interface ModelInfoProps {
  model: string;
  corgiMode: boolean;
  errorCount: number;
  showErrorDetails: boolean;
  showMemoryUsage?: boolean;
  promptTokenCount: number;
  isNarrow: boolean;
  hideModelInfo?: boolean;
}

export const ModelInfo: React.FC<ModelInfoProps> = ({
  model,
  corgiMode,
  errorCount,
  showErrorDetails,
  showMemoryUsage,
  promptTokenCount,
  isNarrow,
  hideModelInfo = false,
}) => {
  if (
    hideModelInfo &&
    !showMemoryUsage &&
    !corgiMode &&
    (showErrorDetails || errorCount === 0)
  ) {
    return null;
  }

  return (
    <Box alignItems="center" paddingTop={isNarrow ? 1 : 0}>
      {!hideModelInfo && (
        <Box alignItems="center">
          <Text color={theme.text.primary}>
            {isNarrow ? '' : ' '}
            {model}{' '}
            <ContextUsageDisplay
              promptTokenCount={promptTokenCount}
              model={model}
            />
          </Text>
          {showMemoryUsage && <MemoryUsageDisplay />}
        </Box>
      )}
      <Box alignItems="center" paddingLeft={2}>
        {corgiMode && (
          <Text>
            {!hideModelInfo && <Text color={theme.ui.comment}>| </Text>}
            <Text color={theme.status.error}>▼</Text>
            <Text color={theme.text.primary}>(´</Text>
            <Text color={theme.status.error}>ᴥ</Text>
            <Text color={theme.text.primary}>`)</Text>
            <Text color={theme.status.error}>▼ </Text>
          </Text>
        )}
        {!showErrorDetails && errorCount > 0 && (
          <Box>
            {!hideModelInfo && <Text color={theme.ui.comment}>| </Text>}
            <ConsoleSummaryDisplay errorCount={errorCount} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
