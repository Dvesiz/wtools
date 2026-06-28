export type MarkdownWordLoadState = 'idle' | 'loading' | 'ready' | 'error'

export interface MarkdownWordProgress {
  state: MarkdownWordLoadState
  percent: number
  message: string
}

export interface MarkdownWordOptions {
  title?: string
  fileName?: string
}

type MdToken = {
  type: string
  raw?: string
  text?: string
  depth?: number
  lang?: string
  ordered?: boolean
  items?: MdToken[]
  tokens?: MdToken[]
  header?: MdToken[]
  rows?: MdToken[][]
  cells?: MdToken[][]
  href?: string
  title?: string | null
}

type MarkedApi = {
  lexer(markdown: string, options?: Record<string, unknown>): MdToken[]
  Lexer?: {
    lexInline(markdown: string, options?: Record<string, unknown>): MdToken[]
  }
}

type MarkdownWordDeps = {
  marked: MarkedApi
  docx: Record<string, any>
}

const PAGE_WIDTH = 11906
const PAGE_HEIGHT = 16838
const PAGE_MARGIN = 1134
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2

const MARKED_CDN = 'https://esm.sh/marked@15.0.12?bundle'
const DOCX_CDN = 'https://esm.sh/docx@9.5.1?bundle'

let depsPromise: Promise<MarkdownWordDeps> | null = null
let deps: MarkdownWordDeps | null = null

export function getMarkdownWordState(): MarkdownWordLoadState {
  return deps ? 'ready' : depsPromise ? 'loading' : 'idle'
}

export function resetMarkdownWord(): void {
  deps = null
  depsPromise = null
}

export async function loadMarkdownWordDeps(
  onProgress?: (state: MarkdownWordProgress) => void,
): Promise<MarkdownWordDeps> {
  if (deps) return deps
  if (depsPromise) return depsPromise

  depsPromise = (async () => {
    onProgress?.({ state: 'loading', percent: 20, message: 'Loading Markdown parser from CDN...' })
    const markedModule = await import(/* @vite-ignore */ MARKED_CDN) as { marked: MarkedApi }

    onProgress?.({ state: 'loading', percent: 65, message: 'Loading Word generator from CDN...' })
    const docxModule = await import(/* @vite-ignore */ DOCX_CDN) as Record<string, any>

    deps = {
      marked: markedModule.marked,
      docx: docxModule,
    }
    onProgress?.({ state: 'ready', percent: 100, message: 'Converter ready' })
    return deps
  })()

  try {
    return await depsPromise
  } catch (error) {
    depsPromise = null
    onProgress?.({
      state: 'error',
      percent: 0,
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function markdownToWordBlob(
  markdown: string,
  options: MarkdownWordOptions = {},
  onProgress?: (state: MarkdownWordProgress) => void,
): Promise<Blob> {
  const { marked, docx } = await loadMarkdownWordDeps(onProgress)
  onProgress?.({ state: 'loading', percent: 75, message: 'Parsing Markdown...' })

  const tokens = marked.lexer(markdown, { gfm: true, breaks: false })
  const builder = new WordBuilder(docx, marked)
  const children = await builder.renderBlocks(tokens)

  const doc = new docx.Document({
    creator: 'wtools',
    title: options.title || options.fileName || 'Markdown Document',
    numbering: {
      config: [
        {
          reference: 'markdown-bullet',
          levels: [{
            level: 0,
            format: docx.LevelFormat.BULLET,
            text: '-',
            alignment: docx.AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 480, hanging: 240 } } },
          }],
        },
        {
          reference: 'markdown-numbering',
          levels: [{
            level: 0,
            format: docx.LevelFormat.DECIMAL,
            text: '%1.',
            alignment: docx.AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 560, hanging: 280 } } },
          }],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Microsoft YaHei', size: 22, color: '1F2937' },
          paragraph: { spacing: { after: 120, line: 340 } },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Microsoft YaHei', size: 36, bold: true, color: '111827' },
          paragraph: {
            spacing: { before: 260, after: 180 },
            outlineLevel: 0,
            border: {
              bottom: {
                color: '2563EB',
                space: 8,
                style: docx.BorderStyle.SINGLE,
                size: 10,
              },
            },
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Microsoft YaHei', size: 30, bold: true, color: '1F4E79' },
          paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Microsoft YaHei', size: 25, bold: true, color: '374151' },
          paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 },
        },
        {
          id: 'CodeBlock',
          name: 'Code Block',
          basedOn: 'Normal',
          run: { font: 'Consolas', size: 19, color: '111827' },
          paragraph: {
            spacing: { before: 0, after: 0, line: 260 },
            indent: { left: 240 },
            shading: { type: docx.ShadingType.CLEAR, color: 'auto', fill: 'F6F8FA' },
          },
        },
        {
          id: 'BlockQuote',
          name: 'Block Quote',
          basedOn: 'Normal',
          run: { color: '4B5563', italics: true },
          paragraph: {
            spacing: { before: 120, after: 120 },
            indent: { left: 360 },
            border: {
              left: {
                color: 'D1D5DB',
                space: 8,
                style: docx.BorderStyle.SINGLE,
                size: 16,
              },
            },
          },
        },
        {
          id: 'ImageFallback',
          name: 'Image Fallback',
          basedOn: 'Normal',
          run: { color: '4B5563', size: 19 },
          paragraph: {
            spacing: { before: 40, after: 40 },
            indent: { left: 240 },
            shading: { type: docx.ShadingType.CLEAR, color: 'auto', fill: 'F9FAFB' },
          },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: {
            top: PAGE_MARGIN,
            right: PAGE_MARGIN,
            bottom: PAGE_MARGIN,
            left: PAGE_MARGIN,
          },
        },
      },
      children: children.length ? children : [
        new docx.Paragraph({ children: [new docx.TextRun('')] }),
      ],
    }],
  })

  onProgress?.({ state: 'loading', percent: 92, message: 'Generating docx...' })
  const blob = await docx.Packer.toBlob(doc)
  onProgress?.({ state: 'ready', percent: 100, message: 'Word document generated' })
  return blob
}

class WordBuilder {
  private readonly docx: Record<string, any>
  private readonly marked: MarkedApi
  private headingCount = 0

  constructor(docx: Record<string, any>, marked: MarkedApi) {
    this.docx = docx
    this.marked = marked
  }

  async renderBlocks(tokens: MdToken[]): Promise<any[]> {
    const children: any[] = []

    for (const token of tokens) {
      switch (token.type) {
        case 'space':
        case 'def':
          break
        case 'heading':
          children.push(await this.heading(token))
          break
        case 'paragraph':
        case 'text':
          children.push(await this.paragraph(token.tokens, token.text))
          break
        case 'blockquote':
          children.push(...await this.blockquote(token))
          break
        case 'list':
          children.push(...await this.list(token))
          break
        case 'code':
          children.push(...this.code(token))
          break
        case 'table':
          children.push(await this.table(token))
          break
        case 'hr':
          children.push(this.hr())
          break
        case 'html':
          children.push(this.htmlFallback(token))
          break
        default:
          if (token.tokens?.length) {
            children.push(...await this.renderBlocks(token.tokens))
          } else if (token.text || token.raw) {
            children.push(await this.paragraph(undefined, token.text || token.raw))
          }
      }
    }

    return children
  }

  private async heading(token: MdToken): Promise<any> {
    this.headingCount += 1
    const levels = [
      this.docx.HeadingLevel.HEADING_1,
      this.docx.HeadingLevel.HEADING_2,
      this.docx.HeadingLevel.HEADING_3,
      this.docx.HeadingLevel.HEADING_4,
      this.docx.HeadingLevel.HEADING_5,
      this.docx.HeadingLevel.HEADING_6,
    ]

    return new this.docx.Paragraph({
      heading: levels[Math.min(Math.max((token.depth || 1) - 1, 0), 5)],
      alignment: this.headingCount === 1 && token.depth === 1 ? this.docx.AlignmentType.CENTER : undefined,
      spacing: {
        before: this.headingCount === 1 && token.depth === 1 ? 0 : 180,
        after: token.depth === 1 ? 180 : 100,
      },
      children: await this.inlineRuns(token.tokens, token.text),
    })
  }

  private async paragraph(tokens?: MdToken[], text = ''): Promise<any> {
    return new this.docx.Paragraph({
      spacing: { after: 120 },
      children: await this.inlineRuns(tokens, text),
    })
  }

  private async blockquote(token: MdToken): Promise<any[]> {
    const source = token.text || token.tokens?.map((item) => item.text || item.raw || '').join('\n') || ''
    return source.split('\n').filter(Boolean).map((line) => new this.docx.Paragraph({
      style: 'BlockQuote',
      children: [new this.docx.TextRun(line)],
    }))
  }

  private async list(token: MdToken): Promise<any[]> {
    const children: any[] = []
    const level = 0
    const reference = token.ordered ? 'markdown-numbering' : undefined

    for (const item of token.items || []) {
      children.push(new this.docx.Paragraph({
        numbering: { reference: token.ordered ? reference : 'markdown-bullet', level },
        style: 'ListParagraph',
        spacing: { after: 70, line: 320 },
        children: await this.listItemRuns(item),
      }))
    }

    return children
  }

  private async listItemRuns(item: MdToken): Promise<any[]> {
    if (!item.tokens?.length) {
      return this.inlineRunsFromMarkdownText(item.text || '')
    }

    const runs: any[] = []
    for (const token of item.tokens) {
      if (token.type === 'paragraph' || token.type === 'text') {
        runs.push(...await this.inlineRuns(token.tokens, token.text || token.raw || ''))
      } else if (token.tokens?.length) {
        runs.push(...await this.inlineRuns(token.tokens, token.text || token.raw || ''))
      } else if (token.text || token.raw) {
        runs.push(...await this.inlineRunsFromMarkdownText(token.text || token.raw || ''))
      }
    }

    return runs.length ? runs : [new this.docx.TextRun('')]
  }

  private code(token: MdToken): any[] {
    const lines = (token.text || '').split('\n')
    const prefix = token.lang ? `${token.lang} 路 ` : ''

    return lines.map((line, index) => new this.docx.Paragraph({
      style: 'CodeBlock',
      border: index === 0 ? {
        top: {
          color: 'E5E7EB',
          space: 6,
          style: this.docx.BorderStyle.SINGLE,
          size: 4,
        },
      } : undefined,
      spacing: {
        before: index === 0 ? 120 : 0,
        after: index === lines.length - 1 ? 120 : 0,
        line: 260,
      },
      children: [new this.docx.TextRun({
        text: `${index === 0 ? prefix : ''}${line || ' '}`,
        font: 'Consolas',
        size: 19,
      })],
    }))
  }

  private async table(token: MdToken): Promise<any> {
    const sourceRows = [token.header || [], ...(token.rows || token.cells || [])]
    const columnCount = Math.max(...sourceRows.map((row) => row.length), 1)
    const columnWidth = Math.floor(CONTENT_WIDTH / columnCount)
    const columnWidths = Array.from({ length: columnCount }, (_, index) =>
      index === columnCount - 1
        ? CONTENT_WIDTH - columnWidth * (columnCount - 1)
        : columnWidth,
    )
    const rows = [
      await this.tableRow(token.header || [], true, columnWidths),
      ...await Promise.all((token.rows || token.cells || []).map((row) => this.tableRow(row, false, columnWidths))),
    ]

    return new this.docx.Table({
      width: { size: CONTENT_WIDTH, type: this.docx.WidthType.DXA },
      columnWidths,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      rows,
    })
  }

  private async tableRow(cells: MdToken[], isHeader: boolean, columnWidths: number[]): Promise<any> {
    const border = { style: this.docx.BorderStyle.SINGLE, size: 1, color: 'D1D5DB' }
    return new this.docx.TableRow({
      tableHeader: isHeader,
      children: await Promise.all(columnWidths.map(async (width, index) => {
        const cell = cells[index]
        return new this.docx.TableCell({
          width: { size: width, type: this.docx.WidthType.DXA },
          margins: { top: 90, bottom: 90, left: 120, right: 120 },
          borders: { top: border, bottom: border, left: border, right: border },
          shading: isHeader ? { type: this.docx.ShadingType.CLEAR, color: 'auto', fill: 'EEF2FF' } : undefined,
          children: [new this.docx.Paragraph({
            spacing: { after: 0, line: 300 },
            children: await this.inlineRuns(cell?.tokens, cell?.text),
          })],
        })
      })),
    })
  }

  private hr(): any {
    return new this.docx.Paragraph({
      border: {
        bottom: {
          color: 'CBD5E1',
          space: 1,
          style: this.docx.BorderStyle.SINGLE,
          size: 8,
        },
      },
      spacing: { before: 180, after: 180 },
    })
  }

  private htmlFallback(token: MdToken): any {
    return new this.docx.Paragraph({
      style: 'CodeBlock',
      children: [new this.docx.TextRun(token.text || token.raw || '')],
    })
  }

  private async inlineRuns(tokens?: MdToken[], fallback = '', style: Record<string, unknown> = {}): Promise<any[]> {
    if (!tokens?.length) {
      return this.inlineRunsFromMarkdownText(fallback || '', style)
    }

    const runs: any[] = []
    for (const token of tokens) {
      switch (token.type) {
        case 'text':
        case 'escape':
          runs.push(...await this.inlineRunsFromMarkdownText(token.text || '', style))
          break
        case 'codespan':
          runs.push(new this.docx.TextRun({
            text: token.text || '',
            font: 'Consolas',
            size: 20,
            color: '111827',
            shading: { type: this.docx.ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
            ...style,
          }))
          break
        case 'strong':
          runs.push(...await this.inlineRuns(token.tokens, token.text, { ...style, bold: true }))
          break
        case 'em':
          runs.push(...await this.inlineRuns(token.tokens, token.text, { ...style, italics: true }))
          break
        case 'del':
          runs.push(...await this.inlineRuns(token.tokens, token.text, { ...style, strike: true }))
          break
        case 'br':
          runs.push(new this.docx.TextRun({ text: '', break: 1, ...style }))
          break
        case 'link':
          runs.push(new this.docx.ExternalHyperlink({
            link: token.href || '',
            children: await this.inlineRuns(token.tokens, token.text || token.href, {
              ...style,
              style: 'Hyperlink',
            }),
          }))
          break
        case 'image':
          runs.push(new this.docx.TextRun({
            text: this.imageLabel(token),
            style: 'ImageFallback',
            italics: true,
            color: '4B5563',
          }))
          break
        case 'html':
          runs.push(new this.docx.TextRun({ text: token.text || token.raw || '', ...style }))
          break
        default:
          if (token.tokens?.length) {
            runs.push(...await this.inlineRuns(token.tokens, token.text, style))
          } else {
            runs.push(...await this.inlineRunsFromMarkdownText(token.text || token.raw || '', style))
          }
      }
    }

    return runs.length ? runs : [new this.docx.TextRun('')]
  }

  private async inlineRunsFromMarkdownText(text: string, style: Record<string, unknown> = {}): Promise<any[]> {
    if (!text) return [new this.docx.TextRun({ text: '', ...style })]

    const tokens = this.marked.Lexer?.lexInline(text, { gfm: true, breaks: false })
    if (tokens?.length && tokens.some((token) => token.type !== 'text')) {
      return this.inlineRuns(tokens, '', style)
    }

    return this.fallbackInlineMarkdownRuns(text, style)
  }

  private fallbackInlineMarkdownRuns(text: string, style: Record<string, unknown>): any[] {
    const runs: any[] = []
    const pattern = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text))) {
      if (match.index > lastIndex) {
        runs.push(...this.textRuns(text.slice(lastIndex, match.index), style))
      }

      const strongText = match[2] || match[3]
      const emText = match[4] || match[5]
      const codeText = match[6]

      if (strongText) {
        runs.push(...this.textRuns(strongText, { ...style, bold: true }))
      } else if (emText) {
        runs.push(...this.textRuns(emText, { ...style, italics: true }))
      } else if (codeText) {
        runs.push(new this.docx.TextRun({
          text: codeText,
          font: 'Consolas',
          size: 20,
          color: '111827',
          shading: { type: this.docx.ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
          ...style,
        }))
      }

      lastIndex = pattern.lastIndex
    }

    if (lastIndex < text.length) {
      runs.push(...this.textRuns(text.slice(lastIndex), style))
    }

    return runs.length ? runs : [new this.docx.TextRun({ text, ...style })]
  }

  private textRuns(text: string, style: Record<string, unknown>): any[] {
    const lines = text.split('\n')
    return lines.flatMap((line, index) => [
      ...(index > 0 ? [new this.docx.TextRun({ text: '', break: 1, ...style })] : []),
      new this.docx.TextRun({ text: line, ...style }),
    ])
  }

  private imageLabel(token: MdToken): string {
    const title = token.text?.trim()
    const href = token.href || ''
    if (href.includes('img.shields.io/badge/')) {
      return title ? `[寰界珷] ${title}` : '[寰界珷]'
    }
    return title ? `[鍥剧墖] ${title}` : '[鍥剧墖]'
  }
}
