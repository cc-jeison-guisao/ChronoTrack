# ChronoTrack - Documentación

## Finalidad

ChronoTrack es una aplicación web de control de asistencia que permite cargar archivos Excel con registros de entrada y salida de colaboradores, visualizar estadísticas de puntualidad, configurar horarios por departamento o empleado, y exportar reportes formateados. No requiere backend: todo el procesamiento se realiza directamente en el navegador.

---

## Stack Tecnológico

- **React 18** con **TypeScript**
- **Vite** como bundler y servidor de desarrollo
- **TailwindCSS** para estilos
- **SheetJS (xlsx)** para lectura y escritura de archivos Excel
- **Recharts** para gráficas

---

## Flujo General

```
Archivo Excel → Carga y validación → Detección de columnas → Cálculo de métricas
  → Visualización en Dashboard / Lista / Gráficas
  → Configuración de horarios → Recálculo de tardanzas
  → Exportación a Excel
```

---

## Carga de Archivos

### Formatos aceptados
- `.xlsx`, `.xls`, `.csv`

### Validación al cargar
La aplicación valida que el archivo contenga las columnas necesarias para funcionar como control de asistencia:

| Columna | Nombres aceptados |
|---------|-------------------|
| Hora de entrada | `A M OnDuty`, `OnDuty`, `Clock In`, `Entrada`, `CheckIn` |
| Hora de salida | `P M OffDuty`, `Clock Out`, `CheckOut`, `Salida`, `OffDuty` |
| Identificación | `User ID`, `Employee ID`, `ID Usuario`, `User Name`, `Nombre` |
| Fecha | Cualquier columna de tipo fecha, o `Date`, `Fecha` |
| Departamento | `Department`, `Departamento`, `Dept`, `Area` (opcional) |

Si faltan columnas requeridas, se muestra un mensaje indicando cuáles son.

### Validación de hora de entrada
- Si la hora de entrada registrada es **mayor o igual a las 12:00 PM**, se considera que el colaborador **no marcó entrada** y la celda se muestra vacía.
- Si además no tiene hora de salida, se le asigna esa hora como salida.

---

## Vistas de la Aplicación

### 1. Dashboard

Vista principal con resumen general de asistencia.

**Tarjetas de métricas globales:**
- Total de colaboradores
- Total de departamentos
- Llegadas tarde
- Total de registros

**Tarjetas por departamento:**
- Nombre del departamento con badge de color
- Cantidad de empleados
- Horario configurado
- Conteo de llegadas tarde y a tiempo

**Detalle de departamento** (al hacer clic en una tarjeta):
- Resumen del departamento con tarjetas de métricas
- Tres pestañas:
  - **Colaboradores**: tabla con días registrados, llegadas tarde y tiempo acumulado (ordenada alfabéticamente)
  - **Gráficas**: gráfica de barras con llegadas tarde por día
  - **Registros**: tabla de datos filtrada por departamento

**Detalle de empleado** (al hacer clic en un colaborador):
- Avatar, nombre, ID y departamento
- Tarjetas: días presentes, llegadas tarde (cantidad y porcentaje), minutos tarde totales
- Gráfica de dona con proporción puntualidad vs tardanza
- Estadísticas rápidas: entrada más temprana, salida más tardía, días a tiempo, promedio de minutos tarde
- Tabla con todos los registros del empleado

---

### 2. Lista

Tabla completa de registros de asistencia con herramientas de filtrado.

**Funcionalidades:**
- **Buscador**: búsqueda por nombre, ID u otro texto
- **Filtro por fechas**: selector "Desde" y "Hasta"
- **Filtro de entrada tardía**: checkbox para mostrar solo llegadas tarde
- **Selector de registros por página**: 25, 50 o 100
- **Ordenamiento**: clic en encabezado de columna (ascendente/descendente)
- **Paginación**: botones Anterior/Siguiente en la parte superior de la tabla

**Columnas mostradas:**
- Departamento, User ID, Nombre, Fecha, Entrada, Salida, Entrada Tardía, Salida Tardía

**Indicadores visuales:**
- Rojo: entrada tardía
- Verde: a tiempo
- Ámbar: tiempo extra en salida

---

### 3. Gráficas

Visualizaciones generadas automáticamente según los datos cargados.

**Tipos de gráficas:**
- **Barras**: valores agregados por categoría (top 20)
- **Líneas**: series temporales o datos secuenciales
- **Dona/Pie**: proporciones categóricas

**Gráfica específica de asistencia:**
- Llegadas tarde vs a tiempo (gráfica de dona con porcentajes)

---

### 4. Horarios

Configuración de horarios de entrada y salida. Solo disponible cuando el archivo tiene columna de departamento.

**Nivel departamento:**
- Configurar hora de entrada y salida para todo el departamento
- Aplica a todos los colaboradores sin horario personalizado

**Nivel empleado:**
- Configurar horario individual que sobreescribe el del departamento
- Badge "Personalizado" cuando tiene horario propio
- Botón de reset para volver al horario del departamento
- Lista de empleados ordenada alfabéticamente

**Horarios por defecto:** 08:00 entrada, 18:00 salida

**Efecto:** Al cambiar un horario, se recalculan automáticamente las tardanzas de todos los registros afectados.

---

## Exportación a Excel

Botón flotante en la esquina inferior derecha de la vista de lista.

**Estructura del archivo exportado** (`control_asistencia.xlsx`):
- Columnas fijas: Departamento, User ID, Nombre
- Columnas de horario base: Entrada y Salida configuradas
- Columnas dinámicas: una pareja Entrada/Salida por cada fecha en los datos

**Formato:**
- Fechas en español completo (ej: "martes 01 de abril del 2025")
- Horas en formato 12 horas (a.m./p.m.)
- Celdas verdes: entrada a tiempo o antes
- Celdas rojas: entrada tardía
- Encabezados con estilo profesional (azul)
- Filas y columnas congeladas para navegación

---

## Modo Oscuro

- Toggle en la barra lateral
- Persiste en `localStorage`
- Detecta preferencia del sistema como valor inicial
- Todos los componentes adaptan colores automáticamente

---

## Acceso por Red Local

El servidor de desarrollo está configurado con `host: '0.0.0.0'`, lo que permite acceder desde otros dispositivos en la misma red usando la IP del equipo (ej: `http://192.168.1.107:5173`).

---

## Arquitectura de Componentes

```
App
├── ThemeProvider
│   └── ScheduleProvider
│       └── DataProvider
│           └── AppContent
│               ├── FileDropZone (estado inicial, sin datos)
│               └── DashboardLayout (con datos cargados)
│                   ├── Sidebar (navegación + tema)
│                   ├── Header (título + info del archivo)
│                   └── Contenido principal:
│                       ├── StatsSummary → DepartmentCard[]
│                       ├── DashboardDepartmentDetail
│                       ├── EmployeeDetail
│                       ├── DataTable
│                       ├── ChartPanel
│                       └── ScheduleView → DepartmentDetail
```

---

## Providers de Estado

| Provider | Responsabilidad |
|----------|----------------|
| **ThemeContext** | Modo claro/oscuro, persistencia en localStorage |
| **DataContext** | Datos parseados, estadísticas, sugerencias de gráficas, recálculo de tardanzas |
| **ScheduleContext** | Horarios por departamento y empleado, límites de entrada/salida |

---

## Localización

Toda la interfaz está en **español (es-ES)**:
- Formato de números: separador decimal con coma
- Formato de fechas: dd/mm/aaaa con nombres de meses en español
- Ordenamiento alfabético con soporte de caracteres españoles
