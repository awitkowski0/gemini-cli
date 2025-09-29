/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Text } from 'ink';
import { Header } from './Header.js';
import { Tips } from './Tips.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { theme } from '../semantic-colors.js';

interface AppHeaderProps {
  version: string;
  isInitialOnboarding: boolean;
}

export const AppHeader = ({ version, isInitialOnboarding }: AppHeaderProps) => {
  const settings = useSettings();
  const config = useConfig();
  const { nightly } = useUIState();

  if (isInitialOnboarding) {
    return (
      <Box flexDirection="column">
        {!(settings.merged.ui?.hideBanner || config.getScreenReader()) && (
          <Header version={version} nightly={nightly} />
        )}
        {!(settings.merged.ui?.hideTips || config.getScreenReader()) && (
          <Tips config={config} />
        )}
      </Box>
    );
  }

  return (
    <Box marginBottom={1} flexDirection="column">
      <Text>
        <Text bold color={theme.text.accent}>
          ✦
        </Text>{' '}
        <Text bold color={theme.text.primary}>
          Gemini CLI
        </Text>{' '}
        <Text color={theme.text.secondary}>v{version}</Text>
      </Text>
      <Text color={theme.text.secondary}>/help for more information</Text>
      <Text color={theme.text.secondary}>
        /init for initializing instructions
      </Text>
      <Text color={theme.text.secondary}>
        /theme for changing your UI theme
      </Text>
      <Text color={theme.text.secondary}>? for shortcuts</Text>
    </Box>
  );
};
