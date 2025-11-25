import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { AgenteIaService } from './agente-ia.service';

describe('AgenteIaService', () => {
  let service: AgenteIaService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [AgenteIaService],
    }).compile();

    service = module.get<AgenteIaService>(AgenteIaService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should forward payload to the webhook and return the response', async () => {
    const payload = { message: 'Hola', history: [] };
    const webhookResponse = { reply: 'Hola!' };
    jest.spyOn(httpService, 'post').mockReturnValue(of({ data: webhookResponse }) as any);

    await expect(service.forwardToWebhook(payload)).resolves.toEqual(webhookResponse);
    expect(httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      payload,
      expect.objectContaining({ timeout: expect.any(Number) }),
    );
  });

  it('should throw BadGatewayException when webhook fails', async () => {
    const payload = { message: 'Hola', history: [] };
    const axiosError = new AxiosError('timeout');
    jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => axiosError));

    await expect(service.forwardToWebhook(payload)).rejects.toMatchObject({
      name: 'BadGatewayException',
    });
  });
});
