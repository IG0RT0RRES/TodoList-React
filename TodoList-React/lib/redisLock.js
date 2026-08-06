import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'

const redis = Redis.fromEnv()

export async function acquireLock(resourceKey, ttlMs = 60000) {
  const lockToken = uuidv4()
  const result = await redis.set(resourceKey, lockToken, {
    nx: true,
    px: ttlMs,
  })
  return result === 'OK' ? lockToken : null
}

export async function releaseLock(resourceKey, lockToken) {
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
  `
  try {
    await redis.eval(luaScript, [resourceKey], [lockToken])
  } catch (error) {
    console.error('Erro ao liberar trava:', error)
  }
}