// GET /api/users/[id]/modules
// Fetch module permissions for a specific user

import { defineEventHandler, getRouterParam, getRequestHeader, createError } from 'h3'
import { pgrest } from '~/server/utils/pgrest'
import { verifyJwt } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Missing or invalid token.' })
  }

  const token = authHeader.substring(7)
  const config = useRuntimeConfig()
  const authUser = verifyJwt(token, config.jwtSecret as string)
  if (!authUser) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  }

  const targetUserId = Number(getRouterParam(event, 'id'))

  if (!targetUserId) {
    throw createError({ statusCode: 400, message: 'User ID is required.' })
  }

  // Only admins and client_admins can view module permissions
  // Users can view their own permissions
  if (authUser.app_role !== 'admin' && 
      authUser.app_role !== 'client_admin' && 
      Number(authUser.sub) !== targetUserId) {
    throw createError({ statusCode: 403, message: 'Forbidden.' })
  }

  try {
    const result = await pgrest<{ module: string }[]>('/user_module_permissions', {
      token,
      query: {
        select: 'module',
        user_id: `eq.${targetUserId}`
      }
    })

    return { modules: result.map(p => p.module) }
  } catch (error) {
    console.error('Error fetching user module permissions:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to fetch module permissions.' 
    })
  }
})
