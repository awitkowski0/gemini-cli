/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Attributes, Meter, Counter, Histogram } from '@opentelemetry/api';
import { diag, metrics, ValueType } from '@opentelemetry/api';
import { SERVICE_NAME, EVENT_CHAT_COMPRESSION } from './constants.js';
import type { Config } from '../config/config.js';
import type { ModelRoutingEvent, ModelSlashCommandEvent } from './types.js';

const TOOL_CALL_COUNT = 'gemini_cli.tool.call.count';
const TOOL_CALL_LATENCY = 'gemini_cli.tool.call.latency';
const API_REQUEST_COUNT = 'gemini_cli.api.request.count';
const API_REQUEST_LATENCY = 'gemini_cli.api.request.latency';
const TOKEN_USAGE = 'gemini_cli.token.usage';
const SESSION_COUNT = 'gemini_cli.session.count';
const FILE_OPERATION_COUNT = 'gemini_cli.file.operation.count';
const INVALID_CHUNK_COUNT = 'gemini_cli.chat.invalid_chunk.count';
const CONTENT_RETRY_COUNT = 'gemini_cli.chat.content_retry.count';
const CONTENT_RETRY_FAILURE_COUNT =
  'gemini_cli.chat.content_retry_failure.count';
const MODEL_ROUTING_LATENCY = 'gemini_cli.model_routing.latency';
const MODEL_ROUTING_FAILURE_COUNT = 'gemini_cli.model_routing.failure.count';
const MODEL_SLASH_COMMAND_CALL_COUNT =
  'gemini_cli.slash_command.model.call_count';

// Performance Monitoring Metrics
const STARTUP_TIME = 'gemini_cli.startup.duration';
const MEMORY_USAGE = 'gemini_cli.memory.usage';
const CPU_USAGE = 'gemini_cli.cpu.usage';
const TOOL_QUEUE_DEPTH = 'gemini_cli.tool.queue.depth';
const TOOL_EXECUTION_BREAKDOWN = 'gemini_cli.tool.execution.breakdown';
const TOKEN_EFFICIENCY = 'gemini_cli.token.efficiency';
const API_REQUEST_BREAKDOWN = 'gemini_cli.api.request.breakdown';
const PERFORMANCE_SCORE = 'gemini_cli.performance.score';
const REGRESSION_DETECTION = 'gemini_cli.performance.regression';
const REGRESSION_PERCENTAGE_CHANGE =
  'gemini_cli.performance.regression.percentage_change';
const BASELINE_COMPARISON = 'gemini_cli.performance.baseline.comparison';

type AttributeTypes<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends number
      ? number
      : T[K] extends boolean
        ? boolean
        : T[K] extends undefined
          ? string | undefined
          : never;
};

interface MetricDefinition<T> {
  name: string;
  attributes: T;
  getCommonAttributes: (config: Config) => Attributes;
}

const baseMetricDefinition = {
  getCommonAttributes: (config: Config): Attributes => ({
    'session.id': config.getSessionId(),
  }),
};

interface MetricDefinitions {
  TOOL_CALL_COUNT: MetricDefinition<{
    function_name: string;
    success: boolean;
    decision?: 'accept' | 'reject' | 'modify' | 'auto_accept';
    tool_type?: 'native' | 'mcp';
  }>;
  TOOL_CALL_LATENCY: MetricDefinition<{
    function_name: string;
  }>;
  API_REQUEST_COUNT: MetricDefinition<{
    model: string;
    status_code: number | string;
    error_type?: string;
  }>;
  API_REQUEST_LATENCY: MetricDefinition<{
    model: string;
  }>;
  TOKEN_USAGE: MetricDefinition<{
    model: string;
    type: 'input' | 'output' | 'thought' | 'cache' | 'tool';
  }>;
  SESSION_COUNT: MetricDefinition<Record<string, never>>;
  FILE_OPERATION_COUNT: MetricDefinition<{
    operation: FileOperation;
    lines?: number;
    mimetype?: string;
    extension?: string;
    programming_language?: string;
  }>;
  INVALID_CHUNK_COUNT: MetricDefinition<Record<string, never>>;
  CONTENT_RETRY_COUNT: MetricDefinition<Record<string, never>>;
  CONTENT_RETRY_FAILURE_COUNT: MetricDefinition<Record<string, never>>;
  MODEL_ROUTING_LATENCY: MetricDefinition<{
    'routing.decision_model': string;
    'routing.decision_source': string;
  }>;
  MODEL_ROUTING_FAILURE_COUNT: MetricDefinition<{
    'routing.decision_source': string;
    'routing.error_message': string;
  }>;
  MODEL_SLASH_COMMAND_CALL_COUNT: MetricDefinition<{
    'slash_command.model.model_name': string;
  }>;
  STARTUP_TIME: MetricDefinition<{
    phase: string;
    details?: Record<string, string | number | boolean>;
  }>;
  MEMORY_USAGE: MetricDefinition<{
    memory_type: MemoryMetricType;
    component?: string;
  }>;
  CPU_USAGE: MetricDefinition<{
    component?: string;
  }>;
  TOOL_QUEUE_DEPTH: MetricDefinition<Record<string, never>>;
  TOOL_EXECUTION_BREAKDOWN: MetricDefinition<{
    function_name: string;
    phase: ToolExecutionPhase;
  }>;
  TOKEN_EFFICIENCY: MetricDefinition<{
    model: string;
    metric: string;
    context?: string;
  }>;
  API_REQUEST_BREAKDOWN: MetricDefinition<{
    model: string;
    phase: ApiRequestPhase;
  }>;
  PERFORMANCE_SCORE: MetricDefinition<{
    category: string;
    baseline?: number;
  }>;
  REGRESSION_DETECTION: MetricDefinition<{
    metric: string;
    severity: 'low' | 'medium' | 'high';
    current_value: number;
    baseline_value: number;
  }>;
  REGRESSION_PERCENTAGE_CHANGE: MetricDefinition<{
    metric: string;
    severity: 'low' | 'medium' | 'high';
    current_value: number;
    baseline_value: number;
  }>;
  BASELINE_COMPARISON: MetricDefinition<{
    metric: string;
    category: string;
    current_value: number;
    baseline_value: number;
  }>;
}

export const metricDefinitions: MetricDefinitions = {
  TOOL_CALL_COUNT: {
    ...baseMetricDefinition,
    name: TOOL_CALL_COUNT,
    attributes: {
      function_name: '',
      success: false,
      decision: undefined,
      tool_type: undefined,
    },
  },
  TOOL_CALL_LATENCY: {
    ...baseMetricDefinition,
    name: TOOL_CALL_LATENCY,
    attributes: {
      function_name: '',
    },
  },
  API_REQUEST_COUNT: {
    ...baseMetricDefinition,
    name: API_REQUEST_COUNT,
    attributes: {
      model: '',
      status_code: '',
      error_type: undefined,
    },
  },
  API_REQUEST_LATENCY: {
    ...baseMetricDefinition,
    name: API_REQUEST_LATENCY,
    attributes: {
      model: '',
    },
  },
  TOKEN_USAGE: {
    ...baseMetricDefinition,
    name: TOKEN_USAGE,
    attributes: {
      model: '',
      type: 'input',
    },
  },
  SESSION_COUNT: {
    ...baseMetricDefinition,
    name: SESSION_COUNT,
    attributes: {},
  },
  FILE_OPERATION_COUNT: {
    ...baseMetricDefinition,
    name: FILE_OPERATION_COUNT,
    attributes: {
      operation: FileOperation.CREATE,
      lines: undefined,
      mimetype: undefined,
      extension: undefined,
      programming_language: undefined,
    },
  },
  INVALID_CHUNK_COUNT: {
    ...baseMetricDefinition,
    name: INVALID_CHUNK_COUNT,
    attributes: {},
  },
  CONTENT_RETRY_COUNT: {
    ...baseMetricDefinition,
    name: CONTENT_RETRY_COUNT,
    attributes: {},
  },
  CONTENT_RETRY_FAILURE_COUNT: {
    ...baseMetricDefinition,
    name: CONTENT_RETRY_FAILURE_COUNT,
    attributes: {},
  },
  MODEL_ROUTING_LATENCY: {
    ...baseMetricDefinition,
    name: MODEL_ROUTING_LATENCY,
    attributes: {
      'routing.decision_model': '',
      'routing.decision_source': '',
    },
  },
  MODEL_ROUTING_FAILURE_COUNT: {
    ...baseMetricDefinition,
    name: MODEL_ROUTING_FAILURE_COUNT,
    attributes: {
      'routing.decision_source': '',
      'routing.error_message': '',
    },
  },
  MODEL_SLASH_COMMAND_CALL_COUNT: {
    ...baseMetricDefinition,
    name: MODEL_SLASH_COMMAND_CALL_COUNT,
    attributes: {
      'slash_command.model.model_name': '',
    },
  },
  STARTUP_TIME: {
    ...baseMetricDefinition,
    name: STARTUP_TIME,
    attributes: {
      phase: '',
      details: undefined,
    },
  },
  MEMORY_USAGE: {
    ...baseMetricDefinition,
    name: MEMORY_USAGE,
    attributes: {
      memory_type: MemoryMetricType.HEAP_USED,
      component: undefined,
    },
  },
  CPU_USAGE: {
    ...baseMetricDefinition,
    name: CPU_USAGE,
    attributes: {
      component: undefined,
    },
  },
  TOOL_QUEUE_DEPTH: {
    ...baseMetricDefinition,
    name: TOOL_QUEUE_DEPTH,
    attributes: {},
  },
  TOOL_EXECUTION_BREAKDOWN: {
    ...baseMetricDefinition,
    name: TOOL_EXECUTION_BREAKDOWN,
    attributes: {
      function_name: '',
      phase: ToolExecutionPhase.EXECUTION,
    },
  },
  TOKEN_EFFICIENCY: {
    ...baseMetricDefinition,
    name: TOKEN_EFFICIENCY,
    attributes: {
      model: '',
      metric: '',
      context: undefined,
    },
  },
  API_REQUEST_BREAKDOWN: {
    ...baseMetricDefinition,
    name: API_REQUEST_BREAKDOWN,
    attributes: {
      model: '',
      phase: ApiRequestPhase.NETWORK_LATENCY,
    },
  },
  PERFORMANCE_SCORE: {
    ...baseMetricDefinition,
    name: PERFORMANCE_SCORE,
    attributes: {
      category: '',
      baseline: undefined,
    },
  },
  REGRESSION_DETECTION: {
    ...baseMetricDefinition,
    name: REGRESSION_DETECTION,
    attributes: {
      metric: '',
      severity: 'low',
      current_value: 0,
      baseline_value: 0,
    },
  },
  REGRESSION_PERCENTAGE_CHANGE: {
    ...baseMetricDefinition,
    name: REGRESSION_PERCENTAGE_CHANGE,
    attributes: {
      metric: '',
      severity: 'low',
      current_value: 0,
      baseline_value: 0,
    },
  },
  BASELINE_COMPARISON: {
    ...baseMetricDefinition,
    name: BASELINE_COMPARISON,
    attributes: {
      metric: '',
      category: '',
      current_value: 0,
      baseline_value: 0,
    },
  },
};

export enum FileOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
}

export enum PerformanceMetricType {
  STARTUP = 'startup',
  MEMORY = 'memory',
  CPU = 'cpu',
  TOOL_EXECUTION = 'tool_execution',
  API_REQUEST = 'api_request',
  TOKEN_EFFICIENCY = 'token_efficiency',
}

export enum MemoryMetricType {
  HEAP_USED = 'heap_used',
  HEAP_TOTAL = 'heap_total',
  EXTERNAL = 'external',
  RSS = 'rss',
}

export enum ToolExecutionPhase {
  VALIDATION = 'validation',
  PREPARATION = 'preparation',
  EXECUTION = 'execution',
  RESULT_PROCESSING = 'result_processing',
}

export enum ApiRequestPhase {
  REQUEST_PREPARATION = 'request_preparation',
  NETWORK_LATENCY = 'network_latency',
  RESPONSE_PROCESSING = 'response_processing',
  TOKEN_PROCESSING = 'token_processing',
}

let cliMeter: Meter | undefined;
let toolCallCounter: Counter | undefined;
let toolCallLatencyHistogram: Histogram | undefined;
let apiRequestCounter: Counter | undefined;
let apiRequestLatencyHistogram: Histogram | undefined;
let tokenUsageCounter: Counter | undefined;
let fileOperationCounter: Counter | undefined;
let chatCompressionCounter: Counter | undefined;
let invalidChunkCounter: Counter | undefined;
let contentRetryCounter: Counter | undefined;
let contentRetryFailureCounter: Counter | undefined;
let modelRoutingLatencyHistogram: Histogram | undefined;
let modelRoutingFailureCounter: Counter | undefined;
let modelSlashCommandCallCounter: Counter | undefined;

// Performance Monitoring Metrics
let startupTimeHistogram: Histogram | undefined;
let memoryUsageGauge: Histogram | undefined; // Using Histogram until ObservableGauge is available
let cpuUsageGauge: Histogram | undefined;
let toolQueueDepthGauge: Histogram | undefined;
let toolExecutionBreakdownHistogram: Histogram | undefined;
let tokenEfficiencyHistogram: Histogram | undefined;
let apiRequestBreakdownHistogram: Histogram | undefined;
let performanceScoreGauge: Histogram | undefined;
let regressionDetectionCounter: Counter | undefined;
let regressionPercentageChangeHistogram: Histogram | undefined;
let baselineComparisonHistogram: Histogram | undefined;
let isMetricsInitialized = false;
let isPerformanceMonitoringEnabled = false;

export function getMeter(): Meter | undefined {
  if (!cliMeter) {
    cliMeter = metrics.getMeter(SERVICE_NAME);
  }
  return cliMeter;
}

export function initializeMetrics(config: Config): void {
  if (isMetricsInitialized) return;

  const meter = getMeter();
  if (!meter) return;

  // Initialize core metrics
  toolCallCounter = meter.createCounter(
    metricDefinitions.TOOL_CALL_COUNT.name,
    {
      description: 'Counts tool calls, tagged by function name and success.',
      valueType: ValueType.INT,
    },
  );
  toolCallLatencyHistogram = meter.createHistogram(
    metricDefinitions.TOOL_CALL_LATENCY.name,
    {
      description: 'Latency of tool calls in milliseconds.',
      unit: 'ms',
      valueType: ValueType.INT,
    },
  );
  apiRequestCounter = meter.createCounter(
    metricDefinitions.API_REQUEST_COUNT.name,
    {
      description: 'Counts API requests, tagged by model and status.',
      valueType: ValueType.INT,
    },
  );
  apiRequestLatencyHistogram = meter.createHistogram(
    metricDefinitions.API_REQUEST_LATENCY.name,
    {
      description: 'Latency of API requests in milliseconds.',
      unit: 'ms',
      valueType: ValueType.INT,
    },
  );
  tokenUsageCounter = meter.createCounter(metricDefinitions.TOKEN_USAGE.name, {
    description: 'Counts the total number of tokens used.',
    valueType: ValueType.INT,
  });
  fileOperationCounter = meter.createCounter(
    metricDefinitions.FILE_OPERATION_COUNT.name,
    {
      description: 'Counts file operations (create, read, update).',
      valueType: ValueType.INT,
    },
  );
  chatCompressionCounter = meter.createCounter(EVENT_CHAT_COMPRESSION, {
    description: 'Counts chat compression events.',
    valueType: ValueType.INT,
  });

  // New counters for content errors
  invalidChunkCounter = meter.createCounter(
    metricDefinitions.INVALID_CHUNK_COUNT.name,
    {
      description: 'Counts invalid chunks received from a stream.',
      valueType: ValueType.INT,
    },
  );
  contentRetryCounter = meter.createCounter(
    metricDefinitions.CONTENT_RETRY_COUNT.name,
    {
      description: 'Counts retries due to content errors (e.g., empty stream).',
      valueType: ValueType.INT,
    },
  );
  contentRetryFailureCounter = meter.createCounter(
    metricDefinitions.CONTENT_RETRY_FAILURE_COUNT.name,
    {
      description: 'Counts occurrences of all content retries failing.',
      valueType: ValueType.INT,
    },
  );
  modelRoutingLatencyHistogram = meter.createHistogram(
    metricDefinitions.MODEL_ROUTING_LATENCY.name,
    {
      description: 'Latency of model routing decisions in milliseconds.',
      unit: 'ms',
      valueType: ValueType.INT,
    },
  );
  modelRoutingFailureCounter = meter.createCounter(
    metricDefinitions.MODEL_ROUTING_FAILURE_COUNT.name,
    {
      description: 'Counts model routing failures.',
      valueType: ValueType.INT,
    },
  );
  modelSlashCommandCallCounter = meter.createCounter(
    metricDefinitions.MODEL_SLASH_COMMAND_CALL_COUNT.name,
    {
      description: 'Counts model slash command calls.',
      valueType: ValueType.INT,
    },
  );

  const sessionCounter = meter.createCounter(
    metricDefinitions.SESSION_COUNT.name,
    {
      description: 'Count of CLI sessions started.',
      valueType: ValueType.INT,
    },
  );
  sessionCounter.add(1, baseMetricDefinition.getCommonAttributes(config));

  // Initialize performance monitoring metrics if enabled
  initializePerformanceMonitoring(config);

  isMetricsInitialized = true;
}

export function recordChatCompressionMetrics(
  config: Config,
  attributes: {
    tokens_before: number;
    tokens_after: number;
  },
) {
  if (!chatCompressionCounter || !isMetricsInitialized) return;
  chatCompressionCounter.add(1, {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  });
}

export function recordToolCallMetrics(
  config: Config,
  durationMs: number,
  attributes: AttributeTypes<
    typeof metricDefinitions.TOOL_CALL_COUNT.attributes
  >,
): void {
  if (!toolCallCounter || !toolCallLatencyHistogram || !isMetricsInitialized)
    return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };
  toolCallCounter.add(1, metricAttributes);
  toolCallLatencyHistogram.record(durationMs, {
    ...baseMetricDefinition.getCommonAttributes(config),
    function_name: attributes.function_name,
  });
}

export function recordTokenUsageMetrics(
  config: Config,
  tokenCount: number,
  attributes: AttributeTypes<typeof metricDefinitions.TOKEN_USAGE.attributes>,
): void {
  if (!tokenUsageCounter || !isMetricsInitialized) return;
  tokenUsageCounter.add(tokenCount, {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  });
}

export function recordApiResponseMetrics(
  config: Config,
  durationMs: number,
  attributes: AttributeTypes<
    typeof metricDefinitions.API_REQUEST_COUNT.attributes
  >,
): void {
  if (
    !apiRequestCounter ||
    !apiRequestLatencyHistogram ||
    !isMetricsInitialized
  )
    return;
  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    model: attributes.model,
    status_code: attributes.status_code ?? 'ok',
  };
  apiRequestCounter.add(1, metricAttributes);
  apiRequestLatencyHistogram.record(durationMs, {
    ...baseMetricDefinition.getCommonAttributes(config),
    model: attributes.model,
  });
}

export function recordApiErrorMetrics(
  config: Config,
  durationMs: number,
  attributes: AttributeTypes<
    typeof metricDefinitions.API_REQUEST_COUNT.attributes
  >,
): void {
  if (
    !apiRequestCounter ||
    !apiRequestLatencyHistogram ||
    !isMetricsInitialized
  )
    return;
  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    model: attributes.model,
    status_code: attributes.status_code ?? 'error',
    error_type: attributes.error_type ?? 'unknown',
  };
  apiRequestCounter.add(1, metricAttributes);
  apiRequestLatencyHistogram.record(durationMs, {
    ...baseMetricDefinition.getCommonAttributes(config),
    model: attributes.model,
  });
}

export function recordFileOperationMetric(
  config: Config,
  attributes: AttributeTypes<
    typeof metricDefinitions.FILE_OPERATION_COUNT.attributes
  >,
): void {
  if (!fileOperationCounter || !isMetricsInitialized) return;
  fileOperationCounter.add(1, {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  });
}

// --- New Metric Recording Functions ---

/**
 * Records a metric for when an invalid chunk is received from a stream.
 */
export function recordInvalidChunk(config: Config): void {
  if (!invalidChunkCounter || !isMetricsInitialized) return;
  invalidChunkCounter.add(1, baseMetricDefinition.getCommonAttributes(config));
}

/**
 * Records a metric for when a retry is triggered due to a content error.
 */
export function recordContentRetry(config: Config): void {
  if (!contentRetryCounter || !isMetricsInitialized) return;
  contentRetryCounter.add(1, baseMetricDefinition.getCommonAttributes(config));
}

/**
 * Records a metric for when all content error retries have failed for a request.
 */
export function recordContentRetryFailure(config: Config): void {
  if (!contentRetryFailureCounter || !isMetricsInitialized) return;
  contentRetryFailureCounter.add(
    1,
    baseMetricDefinition.getCommonAttributes(config),
  );
}

export function recordModelSlashCommand(
  config: Config,
  event: ModelSlashCommandEvent,
): void {
  if (!modelSlashCommandCallCounter || !isMetricsInitialized) return;
  modelSlashCommandCallCounter.add(1, {
    ...baseMetricDefinition.getCommonAttributes(config),
    'slash_command.model.model_name': event.model_name,
  });
}

export function recordModelRoutingMetrics(
  config: Config,
  event: ModelRoutingEvent,
): void {
  if (
    !modelRoutingLatencyHistogram ||
    !modelRoutingFailureCounter ||
    !isMetricsInitialized
  )
    return;

  modelRoutingLatencyHistogram.record(event.routing_latency_ms, {
    ...baseMetricDefinition.getCommonAttributes(config),
    'routing.decision_model': event.decision_model,
    'routing.decision_source': event.decision_source,
  });

  if (event.failed) {
    modelRoutingFailureCounter.add(1, {
      ...baseMetricDefinition.getCommonAttributes(config),
      'routing.decision_source': event.decision_source,
      'routing.error_message': event.error_message,
    });
  }
}
// Performance Monitoring Functions

export function initializePerformanceMonitoring(config: Config): void {
  const meter = getMeter();
  if (!meter) return;

  // Check if performance monitoring is enabled in config
  // For now, enable performance monitoring when telemetry is enabled
  // TODO: Add specific performance monitoring settings to config
  isPerformanceMonitoringEnabled = config.getTelemetryEnabled();

  if (!isPerformanceMonitoringEnabled) return;

  // Initialize startup time histogram
  startupTimeHistogram = meter.createHistogram(STARTUP_TIME, {
    description:
      'CLI startup time in milliseconds, broken down by initialization phase.',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });

  // Initialize memory usage histogram (using histogram until ObservableGauge is available)
  memoryUsageGauge = meter.createHistogram(MEMORY_USAGE, {
    description: 'Memory usage in bytes.',
    unit: 'bytes',
    valueType: ValueType.INT,
  });

  // Initialize CPU usage histogram
  cpuUsageGauge = meter.createHistogram(CPU_USAGE, {
    description: 'CPU usage percentage.',
    unit: 'percent',
    valueType: ValueType.DOUBLE,
  });

  // Initialize tool queue depth histogram
  toolQueueDepthGauge = meter.createHistogram(TOOL_QUEUE_DEPTH, {
    description: 'Number of tools in execution queue.',
    valueType: ValueType.INT,
  });

  // Initialize performance breakdowns
  toolExecutionBreakdownHistogram = meter.createHistogram(
    TOOL_EXECUTION_BREAKDOWN,
    {
      description: 'Tool execution time breakdown by phase in milliseconds.',
      unit: 'ms',
      valueType: ValueType.INT,
    },
  );

  tokenEfficiencyHistogram = meter.createHistogram(TOKEN_EFFICIENCY, {
    description:
      'Token efficiency metrics (tokens per operation, cache hit rate, etc.).',
    valueType: ValueType.DOUBLE,
  });

  apiRequestBreakdownHistogram = meter.createHistogram(API_REQUEST_BREAKDOWN, {
    description: 'API request time breakdown by phase in milliseconds.',
    unit: 'ms',
    valueType: ValueType.INT,
  });

  // Initialize performance score and regression detection
  performanceScoreGauge = meter.createHistogram(PERFORMANCE_SCORE, {
    description: 'Composite performance score (0-100).',
    unit: 'score',
    valueType: ValueType.DOUBLE,
  });

  regressionDetectionCounter = meter.createCounter(REGRESSION_DETECTION, {
    description: 'Performance regression detection events.',
    valueType: ValueType.INT,
  });

  regressionPercentageChangeHistogram = meter.createHistogram(
    REGRESSION_PERCENTAGE_CHANGE,
    {
      description:
        'Percentage change compared to baseline for detected regressions.',
      unit: 'percent',
      valueType: ValueType.DOUBLE,
    },
  );

  baselineComparisonHistogram = meter.createHistogram(BASELINE_COMPARISON, {
    description:
      'Performance comparison to established baseline (percentage change).',
    unit: 'percent',
    valueType: ValueType.DOUBLE,
  });
}

export function recordStartupPerformance(
  config: Config,
  durationMs: number,
  attributes: AttributeTypes<typeof metricDefinitions.STARTUP_TIME.attributes>,
): void {
  if (!startupTimeHistogram || !isPerformanceMonitoringEnabled) return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  startupTimeHistogram.record(durationMs, metricAttributes);
}

export function recordMemoryUsage(
  config: Config,
  bytes: number,
  attributes: AttributeTypes<typeof metricDefinitions.MEMORY_USAGE.attributes>,
): void {
  if (!memoryUsageGauge || !isPerformanceMonitoringEnabled) return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  memoryUsageGauge.record(bytes, metricAttributes);
}

export function recordCpuUsage(
  config: Config,
  percentage: number,
  attributes: AttributeTypes<typeof metricDefinitions.CPU_USAGE.attributes>,
): void {
  if (!cpuUsageGauge || !isPerformanceMonitoringEnabled) return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  cpuUsageGauge.record(percentage, metricAttributes);
}

export function recordToolQueueDepth(config: Config, queueDepth: number): void {
  if (!toolQueueDepthGauge || !isPerformanceMonitoringEnabled) return;

  const attributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
  };

  toolQueueDepthGauge.record(queueDepth, attributes);
}

export function recordToolExecutionBreakdown(
  config: Config,
  durationMs: number,
  attributes: AttributeTypes<
    typeof metricDefinitions.TOOL_EXECUTION_BREAKDOWN.attributes
  >,
): void {
  if (!toolExecutionBreakdownHistogram || !isPerformanceMonitoringEnabled)
    return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  toolExecutionBreakdownHistogram.record(durationMs, metricAttributes);
}

export function recordTokenEfficiency(
  config: Config,
  value: number,
  attributes: AttributeTypes<
    typeof metricDefinitions.TOKEN_EFFICIENCY.attributes
  >,
): void {
  if (!tokenEfficiencyHistogram || !isPerformanceMonitoringEnabled) return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  tokenEfficiencyHistogram.record(value, metricAttributes);
}

export function recordApiRequestBreakdown(
  config: Config,
  durationMs: number,
  attributes: AttributeTypes<
    typeof metricDefinitions.API_REQUEST_BREAKDOWN.attributes
  >,
): void {
  if (!apiRequestBreakdownHistogram || !isPerformanceMonitoringEnabled) return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  apiRequestBreakdownHistogram.record(durationMs, metricAttributes);
}

export function recordPerformanceScore(
  config: Config,
  score: number,
  attributes: AttributeTypes<
    typeof metricDefinitions.PERFORMANCE_SCORE.attributes
  >,
): void {
  if (!performanceScoreGauge || !isPerformanceMonitoringEnabled) return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  performanceScoreGauge.record(score, metricAttributes);
}

export function recordPerformanceRegression(
  config: Config,
  attributes: AttributeTypes<
    typeof metricDefinitions.REGRESSION_DETECTION.attributes
  >,
): void {
  if (!regressionDetectionCounter || !isPerformanceMonitoringEnabled) return;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  regressionDetectionCounter.add(1, metricAttributes);

  if (attributes.baseline_value !== 0 && regressionPercentageChangeHistogram) {
    const percentageChange =
      ((attributes.current_value - attributes.baseline_value) /
        attributes.baseline_value) *
      100;
    regressionPercentageChangeHistogram.record(
      percentageChange,
      metricAttributes,
    );
  }
}

export function recordBaselineComparison(
  config: Config,
  attributes: AttributeTypes<
    typeof metricDefinitions.BASELINE_COMPARISON.attributes
  >,
): void {
  if (!baselineComparisonHistogram || !isPerformanceMonitoringEnabled) return;

  if (attributes.baseline_value === 0) {
    diag.warn('Baseline value is zero, skipping comparison.');
    return;
  }
  const percentageChange =
    ((attributes.current_value - attributes.baseline_value) /
      attributes.baseline_value) *
    100;

  const metricAttributes: Attributes = {
    ...baseMetricDefinition.getCommonAttributes(config),
    ...attributes,
  };

  baselineComparisonHistogram.record(percentageChange, metricAttributes);
}

// Utility function to check if performance monitoring is enabled
export function isPerformanceMonitoringActive(): boolean {
  return isPerformanceMonitoringEnabled && isMetricsInitialized;
}
