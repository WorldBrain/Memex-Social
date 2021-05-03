import { StorageHook } from '@worldbrain/memex-common/lib/storage/hooks/types'

const createdAnnotationHook: StorageHook = {
    collection: 'sharedAnnotation',
    operation: 'create',
    numberOfGroups: 0,
    userField: 'user',
    function: async (context) => {
        await context.services.userMessages.pushMessage({
            type: 'created-annotation',
            sharedAnnotationId: context.objectId,
        })
    },
}

export default createdAnnotationHook
