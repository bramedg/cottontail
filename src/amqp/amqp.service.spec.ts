import { Test, TestingModule } from '@nestjs/testing';

describe('AmqpService', () => {
    let service: any;
    
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            {
            provide: 'AmqpService',
            useValue: {
                listen: jest.fn(),
                publishAndWait: jest.fn(),
            },
            },
        ],
        }).compile();
    
        service = module.get('AmqpService');
    });
    
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    
    // Add more tests for the methods of AmqpService as needed
    }
    );