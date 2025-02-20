import { of } from 'rxjs';

import {
  AdHocVariableFilter,
  DataQueryRequest,
  DataSourceInstanceSettings,
  dateTime,
  FieldType,
  PluginType,
  ScopedVars,
} from '@grafana/data/src';
import {
  BackendDataSourceResponse,
  FetchResponse,
  getBackendSrv,
  setBackendSrv,
  VariableInterpolation,
} from '@grafana/runtime/src';
import { SQLQuery } from '@grafana/sql';

import { TemplateSrv } from '../../../features/templating/template_srv';

import InfluxDatasource from './datasource';
import { InfluxOptions, InfluxQuery, InfluxVersion } from './types';

const getAdhocFiltersMock = jest.fn().mockImplementation(() => []);
const replaceMock = jest.fn().mockImplementation((a: string, ...rest: unknown[]) => a);

export const templateSrvStub = {
  getAdhocFilters: getAdhocFiltersMock,
  replace: replaceMock,
} as unknown as TemplateSrv;

export function mockTemplateSrv(
  getAdhocFiltersMock: (datasourceName: string) => AdHocVariableFilter[],
  replaceMock: (
    target?: string,
    scopedVars?: ScopedVars,
    format?: string | Function | undefined,
    interpolations?: VariableInterpolation[]
  ) => string
): TemplateSrv {
  return {
    getAdhocFilters: getAdhocFiltersMock,
    replace: replaceMock,
  } as unknown as TemplateSrv;
}

export function mockBackendService(response: FetchResponse) {
  const fetchMock = jest.fn().mockReturnValue(of(response));
  const origBackendSrv = getBackendSrv();
  setBackendSrv({
    ...origBackendSrv,
    fetch: fetchMock,
  });
  return fetchMock;
}

export function getMockInfluxDS(
  instanceSettings: DataSourceInstanceSettings<InfluxOptions> = getMockDSInstanceSettings(),
  templateSrv: TemplateSrv = templateSrvStub
): InfluxDatasource {
  return new InfluxDatasource(instanceSettings, templateSrv);
}

export function getMockDSInstanceSettings(
  overrideJsonData?: Partial<InfluxOptions>
): DataSourceInstanceSettings<InfluxOptions> {
  return {
    id: 123,
    url: 'proxied',
    access: 'proxy',
    name: 'influxDb',
    readOnly: false,
    uid: 'influxdb-test',
    type: 'influxdb',
    meta: {
      id: 'influxdb-meta',
      type: PluginType.datasource,
      name: 'influxdb-test',
      info: {
        author: {
          name: 'observability-metrics',
        },
        version: 'v0.0.1',
        description: 'test',
        links: [],
        logos: {
          large: '',
          small: '',
        },
        updated: '',
        screenshots: [],
      },
      module: '',
      baseUrl: '',
    },
    jsonData: {
      version: InfluxVersion.InfluxQL,
      httpMode: 'POST',
      dbName: 'site',
      ...(overrideJsonData ? overrideJsonData : {}),
    },
  };
}

export const mockInfluxFetchResponse = (
  overrides?: Partial<FetchResponse<BackendDataSourceResponse>>
): FetchResponse<BackendDataSourceResponse> => {
  return {
    config: {
      url: 'mock-response-url',
    },
    headers: new Headers(),
    ok: false,
    redirected: false,
    status: 0,
    statusText: '',
    type: 'basic',
    url: '',
    data: {
      results: {
        A: {
          status: 200,
          frames: mockInfluxTSDBQueryResponse,
        },
        metadataQuery: {
          status: 200,
          frames: mockInfluxRetentionPolicyResponse,
        },
      },
    },
    ...overrides,
  };
};
export const mockInfluxTSDBQueryResponse = [
  {
    schema: {
      name: 'logs.host',
      fields: [
        {
          name: 'time',
          type: FieldType.time,
        },
        {
          name: 'value',
          type: FieldType.string,
        },
      ],
    },
    data: {
      values: [
        [1645208701000, 1645208702000],
        ['cbfa07e0e3bb 1', 'cbfa07e0e3bb 2'],
      ],
    },
  },
  {
    schema: {
      name: 'logs.message',
      fields: [
        {
          name: 'time',
          type: FieldType.time,
        },
        {
          name: 'value',
          type: FieldType.string,
        },
      ],
    },
    data: {
      values: [
        [1645208701000, 1645208702000],
        ['Station softwareupdated[447]: Adding client 1', 'Station softwareupdated[447]: Adding client 2'],
      ],
    },
  },
  {
    schema: {
      name: 'logs.path',
      fields: [
        {
          name: 'time',
          type: FieldType.time,
        },
        {
          name: 'value',
          type: FieldType.string,
        },
      ],
    },
    data: {
      values: [
        [1645208701000, 1645208702000],
        ['/var/log/host/install.log 1', '/var/log/host/install.log 2'],
      ],
    },
  },
  {
    schema: {
      name: 'textColumn',
      fields: [
        {
          name: 'time',
          type: FieldType.time,
        },
        {
          name: 'value',
          type: FieldType.string,
        },
      ],
    },
    data: {
      values: [
        [1645208701000, 1645208702000],
        ['text 1', 'text 2'],
      ],
    },
  },
];

export const mockInfluxRetentionPolicyResponse = [
  {
    schema: {
      refId: 'metadataQuery',
      fields: [{ name: 'value', type: FieldType.string, typeInfo: { frame: 'string' } }],
    },
    data: { values: [['autogen', 'bar', '5m_avg', '1m_avg', 'default']] },
  },
];

type QueryType = InfluxQuery & SQLQuery;

export const mockInfluxQueryRequest = (targets?: QueryType[]): DataQueryRequest<QueryType> => {
  return {
    app: 'explore',
    interval: '1m',
    intervalMs: 60000,
    range: {
      from: dateTime(0),
      to: dateTime(10),
      raw: { from: dateTime(0), to: dateTime(10) },
    },
    rangeRaw: {
      from: dateTime(0),
      to: dateTime(10),
    },
    requestId: '',
    scopedVars: {},
    startTime: 0,
    targets: targets ?? mockTargets(),
    timezone: '',
  };
};

export const mockTargets = (): QueryType[] => {
  return [
    {
      refId: 'A',
      datasource: {
        type: 'influxdb',
        uid: 'vA4bkHenk',
      },
      policy: 'default',
      resultFormat: 'time_series',
      orderByTime: 'ASC',
      tags: [],
      groupBy: [
        {
          type: 'time',
          params: ['$__interval'],
        },
        {
          type: 'fill',
          params: ['null'],
        },
      ],
      select: [
        [
          {
            type: 'field',
            params: ['value'],
          },
          {
            type: 'mean',
            params: [],
          },
        ],
      ],
      measurement: 'cpu',
    },
  ];
};

export const mockInfluxQueryWithTemplateVars = (adhocFilters: AdHocVariableFilter[]): InfluxQuery => ({
  refId: 'x',
  alias: '$interpolationVar',
  measurement: '$interpolationVar',
  policy: '$interpolationVar',
  limit: '$interpolationVar',
  slimit: '$interpolationVar',
  tz: '$interpolationVar',
  tags: [
    {
      key: 'cpu',
      operator: '=~',
      value: '/^$interpolationVar,$interpolationVar2$/',
    },
  ],
  groupBy: [
    {
      params: ['$interpolationVar'],
      type: 'tag',
    },
  ],
  select: [
    [
      {
        params: ['$interpolationVar'],
        type: 'field',
      },
    ],
  ],
  adhocFilters,
});

export const mockInfluxSQLFetchResponse: FetchResponse<BackendDataSourceResponse> = {
  config: {
    url: 'mock-response-url',
  },
  headers: new Headers(),
  ok: false,
  redirected: false,
  status: 0,
  statusText: '',
  type: 'basic',
  url: '',
  data: {
    results: {
      A: {
        status: 200,
        frames: [
          {
            schema: {
              refId: 'A',
              meta: {
                typeVersion: [0, 0],
                custom: {
                  headers: {
                    'content-type': ['application/grpc'],
                    date: ['Tue, 07 Nov 2023 21:18:27 GMT'],
                    'strict-transport-security': ['max-age=15724800; includeSubDomains'],
                    'trace-id': ['05b4f1f285b4bbe2'],
                    'trace-sampled': ['false'],
                    'x-envoy-upstream-service-time': ['15'],
                  },
                },
                executedQueryString:
                  'SELECT "usage_idle", time FROM iox.cpu WHERE time \u003e= cast(\'2023-11-07T21:13:27Z\' as timestamp) ',
              },
              fields: [
                {
                  name: 'usage_idle',
                  type: FieldType.number,
                },
                {
                  name: 'time',
                  type: FieldType.time,
                },
              ],
            },
            data: {
              values: [
                [99.09629480869259, 99.0866204958598, 99.24736578023098, 99.24736578023054, 99.11619965852707],
                [1699391610000, 1699391620000, 1699391630000, 1699391640000, 1699391650000],
              ],
            },
          },
        ],
      },
    },
  },
};

export const mockInfluxSQLVariableFetchResponse: FetchResponse<BackendDataSourceResponse> = {
  config: {
    url: 'mock-response-url',
  },
  headers: new Headers(),
  ok: false,
  redirected: false,
  status: 0,
  statusText: '',
  type: 'basic',
  url: '',
  data: {
    results: {
      metricFindQuery: {
        status: 200,
        frames: [
          {
            schema: {
              refId: 'metricFindQuery',
              meta: {
                typeVersion: [0, 0],
                custom: {
                  headers: {
                    'content-type': ['application/grpc'],
                    date: ['Tue, 07 Nov 2023 22:19:44 GMT'],
                    'strict-transport-security': ['max-age=15724800; includeSubDomains'],
                    'trace-id': ['481a45f6066c0a45'],
                    'trace-sampled': ['false'],
                    'x-envoy-upstream-service-time': ['8'],
                  },
                },
                executedQueryString:
                  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'iox' ORDER BY table_name",
              },
              fields: [
                {
                  name: 'table_name',
                  type: FieldType.string,
                },
              ],
            },
            data: {
              values: [['airSensors', 'cpu', 'disk', 'diskio', 'kernel', 'mem', 'processes', 'swap', 'system']],
            },
          },
        ],
      },
    },
  },
};
