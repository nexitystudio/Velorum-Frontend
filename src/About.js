// 🏢 **ABOUT.JS** - PÁGINA DE INFORMACIÓN DE LA EMPRESA
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

function About() {
  const navigate = useNavigate();
  return (
    <div className="about-page">
      {/* 🎯 HERO SECTION */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">Acerca de Velorum</h1>
          <p className="hero-subtitle">
            Vendemos relojes de alta calidad seleccionados por su rendimiento y estilo
          </p>
        </div>
      </section>

      {/* 📖 NUESTRA HISTORIA */}
      <section className="about-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Nuestra Historia</h2>
          </div>
          <div className="content-grid">
            <div className="content-text">
              <p>
                Velorum arrancó en 2023 con una idea sencilla: acercar a los coleccionistas y
                aficionados relojes seleccionados por su calidad y trayectoria. En lugar de
                fabricar, nos dedicamos a buscar, verificar y traer al mercado piezas que
                realmente valgan la pena.
              </p>
              <p>
                Trabajamos con proveedores y distribuidores fiables para seleccionar relojes
                que cumplan altos estándares de funcionamiento, estética y durabilidad. Nuestro
                objetivo es ofrecer opciones que los clientes disfruten y con las que se sientan
                tranquilos al comprar.
              </p>
            </div>
            <div className="content-image">
              <div className="history-timeline">
                <div className="timeline-item">
                  <div className="year">2023</div>
                  <div className="milestone">Inicio de actividades: exploración y descubrimiento</div>
                </div>
                <div className="timeline-item">
                  <div className="year">2024</div>
                  <div className="milestone">Expansión del catálogo y alianzas estratégicas</div>
                </div>
                <div className="timeline-item">
                  <div className="year">2025</div>
                  <div className="milestone">Ampliamos alcance nacional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 NUESTRA MISIÓN (ajustada a etapa temprana) */}
      <section className="about-section mission-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Nuestra Misión</h2>
          </div>
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">🔎</div>
              <h3>Curación estricta</h3>
              <p>
                Seleccionamos cada referencia basándonos en calidad, estado y reputación del proveedor.
                Nuestro proceso evita sorpresas y garantiza que lo que vendemos funciona y luce bien.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🤝</div>
              <h3>Relaciones confiables</h3>
              <p>
                Trabajamos con distribuidores y vendedores verificados para asegurar trazabilidad y
                condiciones justas en cada adquisición.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🌟</div>
              <h3>Transparencia para comprar</h3>
              <p>
                Informamos claramente el estado del reloj, sus especificaciones y cualquier historia
                relevante para que la compra sea segura y satisfactoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 👥 NUESTRO EQUIPO (realista para primer año) */}
      <section className="about-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Nuestro Equipo</h2>
          </div>
          <p className="team-intro">
            Empezamos en 2023 como un proyecto entre amigos interesados en relojería. Nos
            enfocamos en buscar, verificar y traer al mercado piezas con buen historial y
            estado, gestionando todo el proceso de venta y posventa con cercanía.
          </p>
          <div className="team-stats">
            <div className="stat-item">
              <div className="stat-number">4</div>
              <div className="stat-label">Equipo Núcleo</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2</div>
              <div className="stat-label">Años Activos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1,200</div>
              <div className="stat-label">Piezas Gestionadas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10</div>
              <div className="stat-label">Regiones Alcance</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌍 NUESTROS VALORES (aterrizados) */}
      <section className="about-section values-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Nuestros Valores</h2>
          </div>
          <div className="values-grid">
            <div className="value-item">
              <h3>🎯 Foco</h3>
              <p>Pocas referencias activas para no diluir calidad ni atención.</p>
            </div>
            <div className="value-item">
              <h3>🤝 Transparencia</h3>
              <p>Decimos qué usamos, qué mejoramos y qué todavía no resolvimos.</p>
            </div>
            <div className="value-item">
              <h3>💡 Aprendizaje</h3>
              <p>Iteramos rápido: versiones cortas, ajustes rápidos, feedback directo.</p>
            </div>
            <div className="value-item">
              <h3>🌱 Responsabilidad</h3>
              <p>Preferimos materiales durables y empaques reutilizables antes que marketing extra.</p>
            </div>
            <div className="value-item">
              <h3>👥 Cercanía</h3>
              <p>Clientes temprano = socios que nos ayudan a decidir qué sigue.</p>
            </div>
            <div className="value-item">
              <h3>⏰ Respeto</h3>
              <p>Apreciamos la relojería clásica mientras exploramos híbridos y nuevas tecnologías.</p>
            </div>
            <div className="value-item">
              <h3>🛠 Simplicidad</h3>
              <p>Preferimos procesos simples y mantenibles en lugar de complejidad innecesaria.</p>
            </div>
            <div className="value-item">
              <h3>📣 Feedback</h3>
              <p>Escuchamos cada correo y ajuste pedido: lo convertimos en iteración real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📞 CONTACTO */}
      <section className="about-section contact-section enhanced-contact">
        <div className="section-container">
          <div className="contact-inner">
            <div className="contact-head">
              <h2>¿Tienes Preguntas?</h2>
            </div>
            <p className="contact-text">
              Nos encantaría conocerte y contarte más sobre nuestros relojes. <br/>
              <span className="muted">Respondemos normalmente dentro de 24h hábiles.</span>
            </p>
            <div className="contact-buttons">
              <button
                className="btn-primary contact-main-btn"
                aria-label="Enviar correo a Velorum"
                onClick={() => {
                  window.open('https://mail.google.com/mail/?view=cm&fs=1&to=velorum.oficial@gmail.com&su=Consulta%20Velorum','_blank');
                }}
              >
                CONTÁCTANOS
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
