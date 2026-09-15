import { describe, expect, it, vi } from 'vitest';
import { createPrimeTrustAdapter } from './prime-trust-adapter';
const origin='https://velyqua.fixture.invalid';
const response=(body:unknown)=>new Response(JSON.stringify(body),{headers:{'X-PRIME-Trust-Protocol':'prime.trust.http.v1'}});

describe('application-scoped PRIME adapter',()=>{
  it('keeps enrollment locked without making a network request',async()=>{
    const fetcher=vi.fn<typeof fetch>(); const adapter=createPrimeTrustAdapter(origin,fetcher);
    await expect(adapter.requestInvitation({recipientLabel:'fixture',permissions:['aquarium.read']})).rejects.toThrow('OWNER_LOCKED');
    await expect(adapter.acceptInvitation('fixture','fixture')).rejects.toThrow('OWNER_LOCKED');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('reads authority projections through the application-bound route',async()=>{
    const fetcher=vi.fn<typeof fetch>().mockResolvedValue(response([{personId:'fixture:one',displayName:'Fixture One'}]));
    expect(await createPrimeTrustAdapter(origin,fetcher).listPeople()).toEqual([{personId:'fixture:one',displayName:'Fixture One'}]);
    expect(fetcher).toHaveBeenCalledWith(origin+'/trust/v1/velyqua/client/people',expect.objectContaining({credentials:'include',redirect:'error'}));
  });
  it('rejects another application and unsupported device authority',async()=>{
    for(const applicationId of ['jarvis','velyqua']) {
      const fetcher=vi.fn<typeof fetch>().mockResolvedValue(response([{applicationId,personId:'one',deviceId:'device',displayName:'device',permissions:['telemetry.publish'],enrolledAt:'2026-01-01'}]));
      await expect(createPrimeTrustAdapter(origin,fetcher).listDevices()).rejects.toThrow('projection');
    }
  });
  it('sends only the target and requires a positive revocation receipt',async()=>{
    const fetcher=vi.fn<typeof fetch>().mockResolvedValue(response({ok:false}));
    await expect(createPrimeTrustAdapter(origin,fetcher).revokeDevice('device:one')).rejects.toThrow('unconfirmed');
    expect(fetcher).toHaveBeenCalledWith(origin+'/trust/v1/velyqua/client/revoke-device',expect.objectContaining({body:'{"target":"device:one"}'}));
  });
});
