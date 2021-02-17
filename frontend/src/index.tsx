import queryString from 'query-string'
import { main } from './main'
import { BackendType } from './types'

main({
    backend: process.env['REACT_APP_BACKEND'] as BackendType,
    logLogicEvents: process.env['REACT_APP_LOG_LOGIC'] === 'true',
    queryParams: queryString.parse(window.location.search),
})
