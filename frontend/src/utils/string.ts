const externalSlugify = require('slugify')

export function capitalize(s : string) {
    return s.charAt(0).toUpperCase() + s.substring(1)
}

export function slugify(s : string) {
    return externalSlugify(s, {
        lower: true,
    })
}
