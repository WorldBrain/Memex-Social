export class DocumentTitleService {
    _titleCount = 0
    _defaultTitle?: string
    _titlesById: { [id: number]: string } = {}
    _titleStack: number[] = []

    constructor(
        public _titleAccess: {
            set: (title: string) => void
            get: () => string
        },
    ) {}

    pushTitle(title: string): number {
        if (!this._defaultTitle) {
            this._defaultTitle = this._titleAccess.get()
        }

        const id = ++this._titleCount
        this._titlesById[id] = title
        this._titleStack.push(id)
        this._titleAccess.set(title)
        return id
    }

    popTitle(id: number) {
        delete this._titlesById[id]
        const index = this._titleStack.indexOf(id)
        if (!index) {
            return
        }
        this._titleStack.splice(index, 1)

        this._setCurrentTitle()
    }

    replaceTitle(id: number, title: string) {
        if (this._titlesById[id]) {
            this._titlesById[id] = title
        }
        this._setCurrentTitle()
    }

    _setCurrentTitle() {
        const titleId = this._titleStack.slice(-1)[0]
        const title = titleId ? this._titlesById[titleId] : this._defaultTitle
        if (title) {
            this._titleAccess.set(title)
        }
    }
}
