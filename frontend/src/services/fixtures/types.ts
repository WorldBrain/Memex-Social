export interface Fixture {
    extends?: string | string[]
    objects: { [collection: string]: any[] }
}
export type FixtureFetcher = (name: string) => Promise<Fixture>
