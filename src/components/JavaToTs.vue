<template>
  <div class="tool-shell unified-shell">
    <div class="shell-header">
      <div class="header-accent" />
      <div class="header-content">
        <div class="header-top">
          <h2>
            <el-icon class="header-icon"><DataAnalysis /></el-icon>
            Java DTO 转 TypeScript
            <el-popover placement="right" :width="280" trigger="hover" :teleported="false" popper-class="info-popover">
              <template #reference>
                <span class="info-btn">i</span>
              </template>
              <div class="info-body">
                <div class="info-section">
                  <div class="info-label">功能</div>
                  <div class="info-text">快速将 Java DTO / VO 代码解析并转换为 TypeScript 接口定义，支持常见类型映射和泛型处理。</div>
                </div>
                <div class="info-section">
                  <div class="info-label">类型映射</div>
                  <div class="info-text">String → string · Integer/Long → number · Boolean → boolean · List&lt;T&gt; → T[] · Map → Record · Date/LocalDate → string</div>
                </div>
                <div class="info-section">
                  <div class="info-label">注意事项</div>
                  <div class="info-text">无法识别的自定义类型会标记 FIXME 注释，需手动补充类型定义。支持 private/protected/public 修饰符，自动跳过注解行和注释行。</div>
                </div>
              </div>
            </el-popover>
          </h2>
        </div>
      </div>
    </div>
    <div class="operation-area">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="12">
          <h4>Java DTO 代码输入</h4>
          <el-input
            v-model="javaCode"
            type="textarea"
            :rows="20"
            placeholder="粘贴你的 Java 类代码，例如：
public class RoleResp {
    private Integer id;
    private String name;
}"
          />
          <div class="action-bar mt-4">
            <el-button type="primary" @click="convertToTs">转换为 TypeScript</el-button>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12">
          <h4>TypeScript 输出</h4>
          <el-input
            v-model="tsCode"
            type="textarea"
            :rows="20"
            readonly
            placeholder="生成的 TypeScript 代码将显示在这里"
          />
          <div v-if="tsCode" class="action-bar mt-4">
            <el-button @click="copyToClipboard">复制结果</el-button>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useContentCache } from '../utils/contentCache'

const { content: javaCode } = useContentCache('java-code', '')
const tsCode = ref('')

const typeMapping: Record<string, string> = {
  'String': 'string',
  'char': 'string',
  'Character': 'string',

  'Integer': 'number',
  'int': 'number',
  'Long': 'number',
  'long': 'number',
  'Short': 'number',
  'short': 'number',
  'Byte': 'number',
  'byte': 'number',
  'Double': 'number',
  'double': 'number',
  'Float': 'number',
  'float': 'number',
  'BigDecimal': 'number',
  'BigInteger': 'number',

  'Boolean': 'boolean',
  'boolean': 'boolean',

  'Date': 'string',
  'Instant': 'string',
  'LocalDate': 'string',
  'LocalTime': 'string',
  'LocalDateTime': 'string',

  'Object': 'any'
}

const parseJavaType = (javaType: string): { tsType: string, isUnknown: boolean } => {
  javaType = javaType.trim();

  // Handle List, Set, Collection
  const collectionMatch = javaType.match(/^(?:List|Set|Collection)<(.+)>$/);
  if (collectionMatch) {
    const innerType = parseJavaType(collectionMatch[1]);
    return {
      tsType: innerType.tsType.includes(' ') || innerType.tsType.includes('|')
        ? `Array<${innerType.tsType}>`
        : `${innerType.tsType}[]`,
      isUnknown: innerType.isUnknown
    };
  }

  // Handle Map
  const mapMatch = javaType.match(/^Map<(.+?),\s*(.+)>$/);
  if (mapMatch) {
    const keyType = parseJavaType(mapMatch[1]);
    const valueType = parseJavaType(mapMatch[2]);
    const validKey = keyType.tsType === 'number' || keyType.tsType === 'string' ? keyType.tsType : 'string';
    return {
      tsType: `Record<${validKey}, ${valueType.tsType}>`,
      isUnknown: valueType.isUnknown
    };
  }

  // Array
  if (javaType.endsWith('[]')) {
    const inner = javaType.slice(0, -2);
    const parsed = parseJavaType(inner);
    return {
      tsType: `${parsed.tsType}[]`,
      isUnknown: parsed.isUnknown
    };
  }

  if (typeMapping[javaType]) {
    return { tsType: typeMapping[javaType], isUnknown: false };
  }

  // Unknown type, likely a custom DTO or unresolved class
  return { tsType: javaType, isUnknown: true };
}

const convertToTs = () => {
  if (!javaCode.value.trim()) {
    ElMessage.warning('请输入 Java 代码')
    return
  }

  const code = javaCode.value

  // Try to find the class name
  const classMatch = code.match(/class\s+(\w+)/);
  let className = classMatch ? classMatch[1] : 'UnknownType';

  // Find all fields
  // Using regex to match `private Type name;` or `protected Type name;`
  // We'll also allow some annotations before it but simplifying it for now.

  // Let's grab lines, strip comments and annotations
  const lines = code.split('\n');
  const fields: { type: string, name: string, isUnknown: boolean }[] = [];

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('//') || line.startsWith('@')) continue;

    // basic matcher: (private|protected|public)? [Type] [name];
    const fieldMatch = line.match(/(?:(?:private|protected|public)\s+)?([\w<>,?[\] ]+)\s+(\w+)\s*;/);
    if (fieldMatch) {
      let rawType = fieldMatch[1].trim();
      let fieldName = fieldMatch[2].trim();

      const parsedType = parseJavaType(rawType);

      fields.push({
        name: fieldName,
        type: parsedType.tsType,
        isUnknown: parsedType.isUnknown
      });
    }
  }

  let tsOutput = `export interface ${className} {\n`;
  let hasUnknowns = false;

  for (const field of fields) {
    if (field.isUnknown) {
      hasUnknowns = true;
      tsOutput += `  ${field.name}: ${field.type}; // FIXME: 未知类型/自定义DTO，需提供 ${field.type} 的定义\n`;
    } else {
      tsOutput += `  ${field.name}: ${field.type};\n`;
    }
  }
  tsOutput += `}\n`;

  tsCode.value = tsOutput;

  if (hasUnknowns) {
    ElMessage.warning('检测到未知类型，请检查注释')
  } else {
    ElMessage.success('转换成功')
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(tsCode.value)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败，请手动选择复制')
  }
}
</script>

