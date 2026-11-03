# MIC Product Assistant Field Bindings

这份表用于维护插件的“板块 -> DOM 区域 -> 字段”绑定规则。它是插件调试文档，不是跨类别通用表单模板。某字段是否属于目标 MIC 类别，应以当前编辑页 Context 或 `mic-category-form-schema/v1` 为准。插件应优先按板块填充，不使用全页面字段猜测。

## 板块顺序

| 顺序 | 文本板块 | 页面区域 |
| --- | --- | --- |
| 1 | `# 基本信息` | `data-anchor="prodName"` |
| 2 | `# 产品亮点` | `#highlightRoot` |
| 3 | `# 产品属性` | `data-anchor="prodAttrs"` |
| 4 | `# 规格管理` | `data-anchor="specsMng"` |
| 5 | `# FOB价格设置` | `data-anchor="skuFob"` |
| 6 | `# 计量单位` | `data-anchor="unit"` |
| 7 | `# 包裹尺寸` | `data-anchor="package"` |
| 8 | `# 运费信息` | `data-anchor="shipping"` / `select[name="logTemplateId"]` |
| 9 | `# 发货效率信息` | `data-anchor="sent"` |
| 10 | `# 样品单交易设置` | `data-anchor="sample"` |
| 11 | `# 其他信息设置` | `data-anchor="other"` / `data-anchor="otherInfo"` |
| 12 | `# FAQ` | `#faqRoot` |

`产品展示` 和 `产品详情` 不参与一键提取。运费信息通过当前页面真实的 `select[name="logTemplateId"]` 提取，并由 `capabilities.shippingTemplateBulkFill` 标明是否支持回填。

## 明确绑定字段

| 文本字段 | 页面板块 | 页面控件 |
| --- | --- | --- |
| `产品名称` | 基本信息 | `textarea[name="prodName"]` |
| `产品型号` | 基本信息 | `input[name="prodModel"]` |
| `关键词` | 基本信息 | 可重复关键词输入；插件技术输入 ceiling 为 20，但 MIC 业务允许/推荐数量由上游当前平台规则决定 |
| `产品亮点1..N` | 产品亮点 | 亮点输入框，按序添加 |
| `认证` | 产品属性 | 标准属性 |
| `功率` | 产品属性 | 标准属性 |
| `发光颜色` | 产品属性 | 标准属性 |
| `电压` | 产品属性 | 标准属性 |
| `防护等级` | 产品属性 | 标准属性 |
| `运输包装` | 产品属性 | `input[name="prodPacking"]` |
| `规格` | 产品属性 | `input[name="prodStandard"]` |
| `商标` | 产品属性 | `input[name="prodTrademark"]` |
| `原产地` | 产品属性 | `input[name="prodOrigin"]` |
| 自定义属性 | 产品属性 | 自定义属性行，按键值对添加 |
| `规格名称` / `规格值` | 规格管理 | 动态规格组；空态先点击 `.J-btn-addSpecGroup` 创建 |
| `规格2名称` / `规格2值` | 规格管理 | 第二规格组 |
| `运费模板` | 运费信息 | `select[name="logTemplateId"]` |

| `规格最小起订量` / `规格商品编码` / `规格库存` / `规格单价` | FOB价格设置 | 按规格价格销售/一口价销售；有规格组合时批量填入每一行 SKU |
| `价格区间N起订量` / `价格区间N单价` / `库存` | FOB价格设置 | 按采购数量-阶梯价销售 |
| `区间价最小起订量` / `区间价最低价` / `区间价最高价` / `区间价库存` | FOB价格设置 | 区间价销售 |
| `计量单位` | 计量单位 | 单位选择框 |
| `单个包裹内产品数量` | 包裹尺寸 | `input[name="packProdNum"]` |
| `单个包裹长` | 包裹尺寸 | `input[name="packDepth"]` |
| `单个包裹宽` | 包裹尺寸 | `input[name="packWidth"]` |
| `单个包裹高` | 包裹尺寸 | `input[name="packHeight"]` |
| `单个包裹毛重` | 包裹尺寸 | `input[name="grossWeight"]` |
| `港口` | 发货效率信息 | `input.J-port` |
| `发货期数量` / `发货期时间` | 发货效率信息 | 第一行发货期 |
| `发货期数量2..N` / `发货期时间2..N` | 发货效率信息 | 指定编号发货期 |
| `提供样品` | 样品单交易设置 | 样品开关 |
| `样品单价` | 样品单交易设置 | `samplesPrice` |
| `样品单位` | 样品单交易设置 | `samplesPricePacking` |
| `单次最多拿样数量` | 样品单交易设置 | `maxSamplesCount` |
| `样品描述` | 样品单交易设置 | `samplesDesc` |
| `支付方式` | 其他信息设置 | 支付方式复选项 |
| `产量` | 其他信息设置 | `input[name="prodProductivity"]` |
| `海关编码` | 其他信息设置 | `input[name="hsCode"]` |
| `FAQ问题N` / `FAQ答案N` | FAQ | FAQ 行，按序添加 |

规格管理空态时，MIC 页面可能只渲染“添加规格”按钮，不会预先渲染 `spec-group` 输入框。提取器仍需输出 `规格1名称` / `规格1值1` 动态字段模板，并在 capabilities 暴露 `specGroupAddSupported`、`specGroupsRendered`、`specValueAddSupportedAfterGroupCreation` 等信息。插件回填器负责先创建规格组，再填写名称和值；不能把空态误判为没有规格字段。

`产品展示` 和 `产品详情` 不参与一键提取。运费信息通过当前页面真实的 `select[name="logTemplateId"]` 提取，并由 `capabilities.shippingTemplateBulkFill` 标明是否支持回填。

## 自定义属性保留字段

这些字段不要作为自定义属性填写：

`认证`、`功率`、`发光颜色`、`电压`、`防护等级`、`IP Rating`、`运输包装`、`规格`、`商标`、`原产地`、`产品名称`、`产品型号`、`关键词`、`规格名称`、`规格值`、`FOB价格设置` 相关字段、`包裹尺寸` 相关字段、`样品单交易设置` 相关字段、`FAQ`、`产品详情`。

## 维护原则

- 新增字段时，先确认它属于哪个页面板块，再在该板块根节点内绑定控件。
- 不要重新加入全页面字段匹配。
- 如果页面出现同名字段，优先通过 `data-anchor`、模块根节点、模式区域来缩小范围。
- 如果字段属于标准属性，不要同时输出同义自定义属性。
- FOB 价格区有 3 套互斥 DOM：`.J-sku-price`、`.J-ladder-price`、`.J-reference-price`。填价格前必须先激活对应模式，并同步隐藏的 `prodSku` 数据。
