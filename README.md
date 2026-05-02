# 🎓 Sistema de Matriculación Estudiantil — San Gabriel

> Sistema web completo para la gestión del proceso de matriculación académica, desarrollado para optimizar la administración de estudiantes en instituciones educativas.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 📋 Descripción

Este sistema web permite gestionar de manera eficiente el proceso de matriculación estudiantil de la **Unidad Educativa San Gabriel**. Centraliza el registro de estudiantes, control de cupos por paralelo y generación de reportes académicos, eliminando el uso de hojas físicas y reduciendo errores administrativos.

---

## ✨ Funcionalidades principales

- 📝 **Registro de estudiantes** — formulario completo con datos personales y académicos
- 🏫 **Gestión de paralelos y cupos** — control de disponibilidad por grado y sección
- 🔍 **Búsqueda y filtrado** — consulta rápida de estudiantes por nombre, cédula o curso
- 📊 **Reportes y estadísticas** — visualización del estado de matriculación por período
- 🗄️ **Base de datos robusta** — almacenamiento persistente con PostgreSQL y procedimientos almacenados (PLpgSQL)
- 📱 **Interfaz responsive** — adaptada para uso desde computadora y dispositivos móviles

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| JavaScript ES6+ | Lógica del frontend, validaciones, interactividad |
| HTML5 | Estructura semántica de las páginas |
| CSS3 | Estilos, diseño responsive, animaciones |
| PostgreSQL | Base de datos relacional |
| PLpgSQL | Procedimientos almacenados y funciones de base de datos |

---

## 🚀 Instalación y uso local

### Requisitos previos
- Node.js v18 o superior
- PostgreSQL 14 o superior
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/rj7rivera/Sistema-Matriculacion-RJ7.git

# 2. Entrar al directorio del proyecto
cd Sistema-Matriculacion-RJ7/PaginaSanGabriel-Matriculacion

# 3. Instalar dependencias
npm install

# 4. Configurar la base de datos
# Crear una base de datos PostgreSQL llamada "matriculacion_db"
# Ejecutar el script SQL incluido en /database/schema.sql

# 5. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 6. Iniciar el servidor
npm start
```

Abre tu navegador en `http://localhost:3000`

---

## 📁 Estructura del proyecto

```
Sistema-Matriculacion-RJ7/
├── PaginaSanGabriel-Matriculacion/
│   ├── public/
│   │   ├── css/          # Estilos globales y por componente
│   │   ├── js/           # Scripts del frontend
│   │   └── assets/       # Imágenes y recursos estáticos
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Vistas del sistema
│   │   └── database/     # Consultas y conexión a PostgreSQL
│   └── index.html        # Punto de entrada
└── README.md
```

---

## 💡 Contexto del proyecto

Este sistema fue desarrollado durante mi experiencia como **Docente en la Unidad Educativa San Gabriel (Troncal, 2025–2026)**, identificando una necesidad real: el proceso de matriculación se realizaba manualmente, generando demoras y errores en el registro de datos estudiantiles.

La solución digitaliza completamente el flujo, permitiendo al personal administrativo gestionar matriculaciones en minutos en lugar de horas.

---

## 🔮 Mejoras planificadas

- [ ] Autenticación de usuarios con roles (admin, docente, secretaría)
- [ ] Exportación de reportes a PDF y Excel
- [ ] Notificaciones por correo electrónico al matricular
- [ ] Dashboard con métricas en tiempo real
- [ ] Integración con módulo de calificaciones

---

## 👨‍💻 Autor

**Ryan Rivera Jiménez**
Desarrollador Frontend | Ingeniero en Computación e Informática

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ryanrivera-561a85241/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rj7rivera)

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.
