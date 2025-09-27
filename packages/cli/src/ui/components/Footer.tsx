/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { shortenPath, tildeifyPath } from '@google/gemini-cli-core';
import path from 'node:path';
import { DebugProfiler } from './DebugProfiler.js';

import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';

export interface FooterProps {
  targetDir: string;
  branchName?: string;
  debugMode: boolean;
  debugMessage: string;
  vimMode?: string;
  isTrustedFolder?: boolean;
  hideCWD?: boolean;
  hideSandboxStatus?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  targetDir,
  branchName,
  debugMode,
  debugMessage,
  vimMode,
  isTrustedFolder,
  hideCWD = false,
  hideSandboxStatus = false,
}) => {
  const { columns: terminalWidth } = useTerminalSize();

  const isNarrow = isNarrowWidth(terminalWidth);

  // Adjust path length based on terminal width
  const pathLength = Math.max(20, Math.floor(terminalWidth * 0.4));
  const displayPath = isNarrow
    ? path.basename(tildeifyPath(targetDir))
    : shortenPath(tildeifyPath(targetDir), pathLength);

  const justifyContent = hideCWD ? 'center' : 'space-between';

  return (
    <Box
      justifyContent={justifyContent}
      width="100%"
      flexDirection={isNarrow ? 'column' : 'row'}
      alignItems={isNarrow ? 'flex-start' : 'center'}
    >
      {(debugMode || vimMode || !hideCWD) && (
        <Box>
          {debugMode && <DebugProfiler />}
          {vimMode && <Text color={theme.text.secondary}>[{vimMode}] </Text>}
          {!hideCWD && (
            <Text color={theme.text.primary}>
              {displayPath}
              {branchName && (
                <Text color={theme.text.secondary}> ({branchName}*)</Text>
              )}
            </Text>
          )}
          {debugMode && (
            <Text color={theme.status.error}>
              {' ' + (debugMessage || '--debug')}
            </Text>
          )}
        </Box>
      )}

      {/* Middle Section: Centered Trust/Sandbox Info */}
      {!hideSandboxStatus && (
        <Box
          flexGrow={isNarrow || hideCWD ? 0 : 1}
          alignItems="flex-end"
          justifyContent="flex-end"
          display="flex"
          paddingX={isNarrow ? 0 : 1}
          paddingTop={isNarrow ? 1 : 0}
        >
          {isTrustedFolder === false ? (
            <Text color={theme.status.warning}>untrusted</Text>
          ) : process.env['SANDBOX'] &&
            process.env['SANDBOX'] !== 'sandbox-exec' ? (
            <Text color="green">
              {process.env['SANDBOX'].replace(/^gemini-(?:cli-)?/, '')}
            </Text>
          ) : process.env['SANDBOX'] === 'sandbox-exec' ? (
            <Text color={theme.status.warning}>
              macOS Seatbelt{' '}
              <Text color={theme.text.secondary}>
                ({process.env['SEATBELT_PROFILE']})
              </Text>
            </Text>
          ) : (
            <Text color={theme.status.error}>no sandbox</Text>
          )}
        </Box>
      )}
    </Box>
  );
};
