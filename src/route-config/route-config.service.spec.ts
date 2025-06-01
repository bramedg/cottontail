import { Test, TestingModule } from '@nestjs/testing';
import { RouteConfigService } from './route-config.service';
import { RouteConfigLoaderService } from './route-config-loader-service';

describe('RouteConfigService', () => {
  let service: RouteConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouteConfigService, RouteConfigLoaderService],
    }).overrideProvider(RouteConfigLoaderService).useValue({
      getRoutes: () => ({
        '/example/path': {
          get: { roles: ['user'] },
          post: { roles: ['admin'] },
        },
        '/test_stream': {
          sse: { roles: ['admin'] },
        },
      
    })}).compile();

    service = module.get<RouteConfigService>(RouteConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find method config for GET request', () => {
    const result = service.findMethodConfig('/example/path', 'GET');
    expect(result).toEqual({
      config: { roles: ['user'] },
      params: {},
    });
  }
  );

  it('should find method config for POST request', () => { 
    const result = service.findMethodConfig('/example/path', 'POST');
    expect(result).toEqual({
      config: { roles: ['admin'] },
      params: {},
    });
  }
  );

  it('should find method config for SSE request', () => { 
    const result = service.findMethodConfig('/test_stream', 'SSE');
    expect(result).toEqual({
      config: { roles: ['admin'] },
      params: {},
    });
  }
  );

  it('should throw error for non-existent route', () => {
    expect(() => service.findMethodConfig('/non/existent', 'GET')).toThrowError('No routing config found for GET /non/existent');
  }
  );

  it('should validate route authorization with valid token', () => {
    const mockMethodConfig = { roles: ['user'] };
    const mockToken = 'valid.token.here';
    jest.spyOn(service, 'validateRouteAuthorization').mockReturnValue({ roles: ['user'] });
    const result = service.validateRouteAuthorization(mockMethodConfig, mockToken);
    expect(result).toEqual({ roles: ['user'] });
  })

  it('should throw error for insufficient permissions', () => {
    const mockMethodConfig = { roles: ['admin'] };
    const mockToken = 'valid.token.here';
    jest.spyOn(service, 'validateRouteAuthorization').mockImplementation(() => {
      throw new Error('Forbidden: Insufficient permissions');
    });
    expect(() => service.validateRouteAuthorization(mockMethodConfig, mockToken)).toThrowError('Forbidden: Insufficient permissions');
  });

});