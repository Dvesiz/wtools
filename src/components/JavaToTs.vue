<template>
  <div class="tool-shell">
    <h2>Java DTO 转 TypeScript</h2>
    <p class="subtitle">支持常见 DTO 类型，未知类型会标注提示。</p>
    <div class="operation-area">
      <el-row :gutter="20">
        <el-col :span="12">
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
          ></el-input>
          <div class="action-bar mt-4">
            <el-button type="primary" @click="convertToTs">转换为 TypeScript</el-button>
          </div>
        </el-col>
        <el-col :span="12">
          <h4>TypeScript 输出</h4>
          <el-input
            v-model="tsCode"
            type="textarea"
            :rows="20"
            readonly
            placeholder="生成的 TypeScript 代码将显示在这里"
          ></el-input>
          <div class="action-bar mt-4" v-if="tsCode">
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

const javaCode = ref('')
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
    const fieldMatch = line.match(/(?:(?:private|protected|public)\s+)?([\w<>,?\[\] ]+)\s+(\w+)\s*;/);
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

<style scoped>
.tool-shell {
  width: 100%;
  max-width: 860px;
  padding: 20px;
  border: 1px solid #e6e8eb;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.subtitle {
  margin: 6px 0 18px;
  color: #6b7280;
  font-size: 13px;
}

.operation-area {
  margin-top: 12px;
  padding: 14px;
  background: #fafafa;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
