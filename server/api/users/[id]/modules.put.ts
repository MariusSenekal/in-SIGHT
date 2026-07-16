// PUT /api/users/[id]/modules
// Update module permissions for a specific user
// Admin: can manage all users
// Client_admin: can manage users in their own company (enforced by RLS)

import { defineEventHandler, getRouterParam, readBody, getRequestHeader, createError } from 'h3'
import { pgrestAdmin } from '~/server/utils/pgrest'
import { verifyJwt } from '~/server/utils/jwt'

interface ModulePermissionsBody {
  modules: string[]
}

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
  const body = await readBody<ModulePermissionsBody>(event)

  if (!targetUserId) {
    throw createError({ statusCode: 400, message: 'User ID is required.' })
  }

  // Only admins and client_admins can update module permissions
  if (authUser.app_role !== 'admin' && authUser.app_role !== 'client_admin') {
    throw createError({ 
      statusCode: 403, 
      message: 'Only admins and client admins can manage module permissions.' 
    })
  }

  // For client_admin, verify the target user is in their company
  if (authUser.app_role === 'client_admin') {
    try {
      // Check if target user is in same company as client_admin
      const companyCheck = await pgrestAdmin<any[]>('/company_users', {
        query: {
          select: 'company_id',
          user_id: `eq.${targetUserId}`
        }
      })

      const targetUserCompanies = companyCheck.map(c => c.company_id)
      
      // Get client_admin's companies
      const adminCompanies = await pgrestAdmin<any[]>('/company_users', {
        query: {
          select: 'company_id',
          user_id: `eq.${authUser.sub}`
        }
      })

      const adminCompanyIds = adminCompanies.map(c => c.company_id)
      
      // Check if there's any overlap
      const hasSharedCompany = targetUserCompanies.some(id => adminCompanyIds.includes(id))
      
      if (!hasSharedCompany) {
        throw createError({ 
          statusCode: 403, 
          message: 'You can only manage module permissions for users in your company.' 
        })
      }
    } catch (error: any) {
      if (error.statusCode === 403) throw error
      console.error('Error checking company membership:', error)
      throw createError({ 
        statusCode: 500, 
        message: 'Failed to verify company membership.' 
      })
    }
  }

  if (!Array.isArray(body.modules)) {
    throw createError({ statusCode: 400, message: 'Modules must be an array.' })
  }

  const validModules = ['vehicle', 'equipment', 'cleaning', 'qr-codes', 'clients', 'hr']
  const invalidModules = body.modules.filter(m => !validModules.includes(m))
  if (invalidModules.length > 0) {
    throw createError({ 
      statusCode: 400, 
      message: `Invalid modules: ${invalidModules.join(', ')}` 
    })
  }

  // Client admins may only delegate modules already granted to their own account.
  if (authUser.app_role === 'client_admin') {
    try {
      const ownPermissions = await pgrestAdmin<{ module: string }[]>('/user_module_permissions', {
        query: {
          select: 'module',
          user_id: `eq.${authUser.sub}`
        }
      })

      const ownModuleSet = new Set(ownPermissions.map(p => p.module))
      const disallowed = body.modules.filter(module => !ownModuleSet.has(module))

      if (disallowed.length > 0) {
        throw createError({
          statusCode: 403,
          message: `You can only assign modules already granted to your account: ${disallowed.join(', ')}`
        })
      }
    } catch (error: any) {
      if (error?.statusCode === 403) throw error
      console.error('Error validating assignable modules:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to validate assignable modules.'
      })
    }
  }

  try {
    // First, delete all existing permissions for this user
    await pgrestAdmin('/user_module_permissions', {
      method: 'DELETE',
      query: {
        user_id: `eq.${targetUserId}`
      }
    })

    // Then, insert new permissions
    if (body.modules.length > 0) {
      const permissions = body.modules.map(module => ({
        user_id: targetUserId,
        module,
        granted_by: authUser.sub
      }))

      await pgrestAdmin('/user_module_permissions', {
        method: 'POST',
        body: permissions
      })
    }

    return { 
      ok: true, 
      message: 'Module permissions updated successfully.',
      modules: body.modules 
    }
  } catch (error) {
    console.error('Error updating user module permissions:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to update module permissions.' 
    })
  }
})
