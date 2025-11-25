import { Test, TestingModule } from '@nestjs/testing';
import { AgenteIaController } from './agente-ia.controller';
import { AgenteIaService } from './agente-ia.service';

describe('AgenteIaController', () => {
  let controller: AgenteIaController;
  let service: AgenteIaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgenteIaController],
      providers: [
        {
          provide: AgenteIaService,
          useValue: {
            forwardToWebhook: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AgenteIaController>(AgenteIaController);
    service = module.get<AgenteIaService>(AgenteIaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate chat requests to the service', async () => {
    const payload = { message: 'Hola', history: [] };
    const expected = { reply: '¡Hola!' };
    jest.spyOn(service, 'forwardToWebhook').mockResolvedValue(expected);

    await expect(controller.chat(payload)).resolves.toEqual(expected);
    expect(service.forwardToWebhook).toHaveBeenCalledWith(payload);
  });
});
