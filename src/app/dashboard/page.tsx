'use client';
import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Play,
  Brain,
  FileText,
  Zap,
  Users,
  Shield,
  Clock
} from 'lucide-react';

import { useRouter } from 'next/navigation';

const logoImage = '/vytara-logo.png'

export default function LandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // color palette
  const COLORS = {
    bg: '#FBFCFE',
    card: '#FFFFFF',
    panel: 'rgba(16,24,40,0.03)',
    skyStart: '#2EC4FF',
    skyEnd: '#2B8CFF',
    amberStart: '#FFBF69',
    amberEnd: '#FF7B4A',
    green: '#4FD1A6',
    slate: '#0f1724'
  };

  const containerStyle: React.CSSProperties = {
    background: COLORS.bg,
    color: COLORS.slate,
    minHeight: '100vh',
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
  };

  return (
    <div style={containerStyle}>
      {/* Soft colorful blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            left: '-8%',
            top: '-10%',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: `radial-gradient(circle at 20% 20%, ${COLORS.green}22, transparent 40%)`,
            filter: 'blur(64px)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '-6%',
            top: '18%',
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: `radial-gradient(circle at 80% 10%, ${COLORS.amberStart}20, ${COLORS.amberEnd}06, transparent 50%)`,
            filter: 'blur(72px)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '10%',
            bottom: '-8%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle at 10% 80%, ${COLORS.green}14, transparent 60%)`,
            filter: 'blur(60px)'
          }}
        />
      </div>

      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: isScrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
          borderBottom: isScrolled ? '1px solid rgba(15,23,36,0.06)' : 'none',
          backdropFilter: isScrolled ? 'saturate(120%) blur(6px)' : 'none',
          padding: isScrolled ? '10px 20px' : '18px 20px',
          transition: 'all 200ms ease'
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 20
          }}
        >
          <button
            onClick={() => scrollTo('overview')}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: 'white',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
              }}
            >
              <img
                src={logoImage}
                alt="Vytara Logo"
                style={{ width: 32, height: 32, objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.slate }}>
              Vytara
            </div>
          </button>

          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
            <button
              onClick={() => scrollTo('mission')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'rgba(15,23,36,0.75)'
              }}
            >
              Mission
            </button>

            <button
              onClick={() => scrollTo('features')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'rgba(15,23,36,0.75)'
              }}
            >
              Features
            </button>

            <button
              onClick={() => scrollTo('comparison')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'rgba(15,23,36,0.75)'
              }}
            >
              Comparison
            </button>

            <button
              onClick={() => scrollTo('pricing')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'rgba(15,23,36,0.75)'
              }}
            >
              Pricing
            </button>

            <button
              onClick={() => {router.push('/login')}}
              style={{
                marginLeft: 6,
                background: 'transparent',
                border: 'none',
                color: 'rgba(15,23,36,0.7)',
                padding: '8px 10px',
                cursor: 'pointer'
              }}
            >
              Log In
            </button>

            <button
              onClick={() => {router.push('/signup')}}
              style={{
                marginLeft: 8,
                background: `linear-gradient(90deg, ${COLORS.amberStart}, ${COLORS.amberEnd})`,
                border: 'none',
                color: '#07121B',
                padding: '10px 14px',
                borderRadius: 999,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              Get Started
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ paddingTop: 96, position: 'relative', zIndex: 10 }}>
        {/* HERO */}
        <section
          id="overview"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: 1100,
            margin: '0 auto'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              gap: 10,
              alignItems: 'center',
              padding: '8px 14px',
              background: 'rgba(15,23,36,0.03)',
              borderRadius: 999,
              border: '1px solid rgba(15,23,36,0.04)',
              marginBottom: 12
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: COLORS.amberStart,
                boxShadow: `0 0 8px ${COLORS.amberStart}50`
              }}
            />
            <span
              style={{
                fontWeight: 700,
                color: 'rgba(15,23,36,0.85)',
                fontSize: 14
              }}
            >
              Vy (Vitalis - Life) + Tara (Star)
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontWeight: 900,
              lineHeight: 1.02,
              fontSize: 'clamp(28px, 5.5vw, 56px)',
              marginBottom: 16,
              color: 'rgba(15,23,36,0.95)'
            }}
          >
            <div
              style={{
                background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.amberStart})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              A Guiding Star
            </div>
            <div>for Health and Recovery</div>
          </h1>

          <p
            style={{
              color: 'rgba(15,23,36,0.7)',
              maxWidth: 760,
              margin: '14px auto 20px',
              fontSize: 18
            }}
          >
            Drawing from ancient cultures where 'Vy' from Latin 'vitalis' (life) and 'Tara' from Sanskrit (star) symbolize guidance, Vytara serves as your compass in the search for health clarity. A clear, secure dashboard for medical records + instant AI summaries, designed for families and elders with big targets, readable text, and privacy-first approach.
          </p>

          {/* Buttons */}
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => {router.push('/signup')}}
              style={{
                background: `linear-gradient(90deg, ${COLORS.amberStart}, ${COLORS.amberEnd})`,
                color: '#07121B',
                padding: '12px 18px',
                borderRadius: 999,
                border: 'none',
                fontWeight: 800,
                boxShadow: '0 10px 30px rgba(255,123,74,0.12)',
                cursor: 'pointer'
              }}
            >
              Start Free Trial
              <ChevronRight style={{ width: 14, height: 14, marginLeft: 8 }} />
            </button>

            <button
              onClick={() => scrollTo('features')}
              style={{
                background: COLORS.card,
                color: COLORS.slate,
                padding: '12px 18px',
                borderRadius: 999,
                border: '1px solid rgba(15,23,36,0.06)',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(16,24,40,0.04)'
              }}
            >
              <Play style={{ width: 14, height: 14, marginRight: 8 }} /> Watch Demo
            </button>
          </div>

          {/* mockup card */}
          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 920,
                borderRadius: 18,
                overflow: 'hidden',
                border: '1px solid rgba(15,23,36,0.04)',
                boxShadow: '0 30px 60px rgba(16,24,40,0.06)',
                position: 'relative',
                background: COLORS.card
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                  background: `linear-gradient(180deg, ${COLORS.skyStart}08, transparent 30%), 
                               linear-gradient(0deg, ${COLORS.amberStart}06, transparent 40%)`
                }}
              />

              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80"
                alt="Dashboard screenshot"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* floating micro-card */}
              <div
                style={{
                  position: 'absolute',
                  right: 24,
                  bottom: 24,
                  background: '#fff',
                  padding: 12,
                  borderRadius: 12,
                  color: COLORS.slate,
                  border: '1px solid rgba(15,23,36,0.06)',
                  boxShadow: '0 8px 30px rgba(16,24,40,0.06)'
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      display: 'grid',
                      placeItems: 'center',
                      background: `linear-gradient(90deg, ${COLORS.skyStart}, ${COLORS.skyEnd})`
                    }}
                  >
                    <Brain style={{ width: 16, height: 16, color: '#fff' }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>AI Analysis</div>
                </div>

                <div style={{ fontSize: 12, color: 'rgba(15,23,36,0.6)' }}>
                  Instant summary ready
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* mission */}
        <section
          id="mission"
          style={{ padding: '48px 24px', background: COLORS.card, margin: '48px 0' }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: COLORS.slate, marginBottom: 16 }}>
              Our Mission
            </h2>

            <p
              style={{
                color: 'rgba(15,23,36,0.7)',
                maxWidth: 800,
                margin: '0 auto 32px',
                fontSize: 18
              }}
            >
              To empower families with intelligent health management tools that make
              medical information accessible, understandable, and actionable.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))',
                gap: 24,
                marginTop: 32
              }}
            >
              {/* family */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    background: `linear-gradient(90deg, ${COLORS.skyStart}, ${COLORS.skyEnd})`,
                    margin: '0 auto 16px'
                  }}
                >
                  <Users style={{ width: 24, height: 24, color: '#fff' }} />
                </div>
                <h3 style={{ fontWeight: 800 }}>Family-Centric</h3>
                <p style={{ color: 'rgba(15,23,36,0.7)', marginTop: 8 }}>
                  Designed for multi-generational health tracking
                </p>
              </div>

              {/* AI */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    background: `linear-gradient(90deg, ${COLORS.amberStart}, ${COLORS.amberEnd})`,
                    margin: '0 auto 16px'
                  }}
                >
                  <Brain style={{ width: 24, height: 24, color: '#07121B' }} />
                </div>
                <h3 style={{ fontWeight: 800 }}>AI-Powered</h3>
                <p style={{ color: 'rgba(15,23,36,0.7)', marginTop: 8 }}>
                  Intelligent analysis and clear explanations
                </p>
              </div>

              {/* privacy */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.skyStart})`,
                    margin: '0 auto 16px'
                  }}
                >
                  <Shield style={{ width: 24, height: 24, color: '#fff' }} />
                </div>
                <h3 style={{ fontWeight: 800 }}>Privacy-First</h3>
                <p style={{ color: 'rgba(15,23,36,0.7)', marginTop: 8 }}>
                  Your health data stays secure and private
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))',
            gap: 16
          }}
        >
          {[
            {
              label: 'Active Users',
              value: '10k+',
              color: `linear-gradient(90deg, ${COLORS.skyStart}, ${COLORS.skyEnd})`
            },
            {
              label: 'Medical Records',
              value: '2.5M+',
              color: `linear-gradient(90deg, ${COLORS.amberStart}, ${COLORS.amberEnd})`
            },
            {
              label: 'Uptime',
              value: '99.99%',
              color: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.skyStart})`
            },
            {
              label: 'Security',
              value: 'AES-256',
              color: `linear-gradient(90deg, ${COLORS.skyEnd}, ${COLORS.green})`
            }
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: COLORS.card,
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                border: '1px solid rgba(15,23,36,0.04)'
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  color: '#07121B',
                  background: s.color
                }}
              >
                <div style={{ fontSize: 14 }}>{s.value}</div>
              </div>
              <div style={{ color: 'rgba(15,23,36,0.8)' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* FEATURES */}
        <section
          id="features"
          style={{ maxWidth: 1100, margin: '18px auto 48px', padding: '0 24px' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))',
              gap: 16
            }}
          >
            {[
              {
                icon: FileText,
                title: 'Smart Vault',
                desc: 'Upload reports and AI organizes them instantly.',
                accent: COLORS.skyStart
              },
              {
                icon: Zap,
                title: 'Emergency Mode',
                desc: 'One tap shares location & vitals.',
                accent: COLORS.amberStart
              },
              {
                icon: Users,
                title: 'Family Circle',
                desc: 'Manage profiles for parents & kids.',
                accent: COLORS.green
              },
              {
                icon: Brain,
                title: 'Dr. AI',
                desc: 'Get clear, science-backed answers.',
                accent: COLORS.skyEnd
              },
              {
                icon: Shield,
                title: 'Bank-Grade Security',
                desc: 'Encryption & privacy-first.',
                accent: COLORS.green
              },
              {
                icon: Clock,
                title: 'Timeline View',
                desc: 'Visualize health over time.',
                accent: COLORS.amberEnd
              }
            ].map((f, idx) => (
              <div
                key={idx}
                style={{
                  background: COLORS.card,
                  borderRadius: 12,
                  padding: 18,
                  border: '1px solid rgba(15,23,36,0.04)',
                  minHeight: 120
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      background: `${f.accent}22`,
                      color: f.accent
                    }}
                  >
                    <f.icon style={{ width: 18, height: 18 }} />
                  </div>

                  <div>
                    <div style={{ fontWeight: 800 }}>{f.title}</div>
                    <div
                      style={{ marginTop: 6, color: 'rgba(15,23,36,0.75)', fontSize: 14 }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON */}
        <section
          id="comparison"
          style={{ padding: '48px 24px', background: COLORS.card, margin: '48px 0' }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: COLORS.slate,
                marginBottom: 16
              }}
            >
              Why Choose Vytara?
            </h2>

            <p
              style={{
                color: 'rgba(15,23,36,0.7)',
                maxWidth: 800,
                margin: '0 auto 32px',
                fontSize: 18
              }}
            >
              See how Vytara transforms healthcare management compared to traditional
              methods.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
                textAlign: 'left'
              }}
            >
              {/* headers */}
              <div
                style={{
                  fontWeight: 800,
                  padding: '12px 0',
                  borderBottom: '2px solid rgba(15,23,36,0.1)'
                }}
              >
                Feature
              </div>

              <div
                style={{
                  fontWeight: 800,
                  padding: '12px 0',
                  borderBottom: '2px solid rgba(15,23,36,0.1)'
                }}
              >
                Traditional Healthcare
              </div>

              <div
                style={{
                  fontWeight: 800,
                  padding: '12px 0',
                  borderBottom: '2px solid rgba(15,23,36,0.1)'
                }}
              >
                Vytara
              </div>

              {/* rows */}
              {[
                {
                  feature: 'Medical Records',
                  traditional: 'Scattered across hospitals & labs',
                  vytara: 'All reports stored in one secure digital vault'
                },
                {
                  feature: 'Emergency Information',
                  traditional: 'Hard to access during crises',
                  vytara: '1-Tap Emergency Profile with vitals & contacts'
                },
                {
                  feature: 'Report Understanding',
                  traditional: 'Medical jargon is confusing',
                  vytara: 'Instant AI summaries in simple language'
                },
                {
                  feature: 'Follow-ups & Tracking',
                  traditional: 'No organized history',
                  vytara: 'Visual timeline showing improvements & trends'
                },
                {
                  feature: 'Family Health Management',
                  traditional: 'Each person handles separately',
                  vytara: 'One shared family dashboard'
                },
                {
                  feature: 'Reminders',
                  traditional: 'Manual & easy to forget',
                  vytara: 'Smart reminders for medicines & appointments'
                },
                {
                  feature: 'Security',
                  traditional: 'Risk of loss / physical damage',
                  vytara: 'Bank-grade encryption + cloud backup'
                },
                {
                  feature: 'Availability',
                  traditional: 'Depends on clinics & staff',
                  vytara: '24×7 access from any device'
                },
                {
                  feature: 'Cost',
                  traditional: 'Expensive visits & repeats',
                  vytara: 'Free basic plan + affordable AI insights'
                }
              ].map((row, idx) => (
                <React.Fragment key={idx}>
                  <div
                    style={{
                      fontWeight: 700,
                      padding: '16px 0',
                      borderBottom:
                        idx < 8 ? '1px solid rgba(15,23,36,0.04)' : 'none'
                    }}
                  >
                    {row.feature}
                  </div>

                  <div
                    style={{
                      padding: '16px 0',
                      color: 'rgba(15,23,36,0.7)',
                      borderBottom:
                        idx < 8 ? '1px solid rgba(15,23,36,0.04)' : 'none'
                    }}
                  >
                    {row.traditional}
                  </div>

                  <div
                    style={{
                      padding: '16px 0',
                      color: 'rgba(15,23,36,0.7)',
                      borderBottom:
                        idx < 8 ? '1px solid rgba(15,23,36,0.04)' : 'none',
                      background: `${COLORS.green}08`,
                      borderRadius: 6,
                      margin: '4px 0'
                    }}
                  >
                    {row.vytara}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding: '0 24px 48px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.slate }}>
              Simple Pricing
            </h2>
            <p style={{ color: 'rgba(15,23,36,0.7)', marginTop: 8 }}>
              Transparent plans — start free.
            </p>
          </div>

          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))',
              gap: 16
            }}
          >
            {/* basic */}
            <div
              style={{
                padding: 18,
                borderRadius: 12,
                background: COLORS.card,
                border: '1px solid rgba(15,23,36,0.04)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  height: 6,
                  width: 48,
                  margin: '0 auto 8px',
                  borderRadius: 999,
                  background: COLORS.skyStart
                }}
              />
              <h3 style={{ fontWeight: 800 }}>Basic</h3>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>Free</div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  marginTop: 12,
                  color: 'rgba(15,23,36,0.7)'
                }}
              >
                <li>50 Documents</li>
                <li>1 Profile</li>
              </ul>
              <button
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(15,23,36,0.06)',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Get Started
              </button>
            </div>

            {/* pro */}
            <div
              style={{
                padding: 18,
                borderRadius: 12,
                background: `linear-gradient(180deg, ${COLORS.card}, #fff)`,
                border: '1px solid rgba(15,23,36,0.06)',
                textAlign: 'center',
                boxShadow: '0 12px 30px rgba(16,24,40,0.06)'
              }}
            >
              <div
                style={{
                  height: 6,
                  width: 64,
                  margin: '0 auto 8px',
                  borderRadius: 999,
                  background: COLORS.amberStart
                }}
              />
              <h3 style={{ fontWeight: 800 }}>Pro</h3>

              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>
                ₹299{' '}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(15,23,36,0.6)'
                  }}
                >
                  /mo
                </span>
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  marginTop: 12,
                  color: 'rgba(15,23,36,0.7)'
                }}
              >
                <li>Unlimited storage</li>
                <li>Priority AI analysis</li>
              </ul>

              <button
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: `linear-gradient(90deg, ${COLORS.amberStart}, ${COLORS.amberEnd})`,
                  color: '#07121B',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Start Trial
              </button>
            </div>

            {/* family */}
            <div
              style={{
                padding: 18,
                borderRadius: 12,
                background: COLORS.card,
                border: '1px solid rgba(15,23,36,0.04)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  height: 6,
                  width: 48,
                  margin: '0 auto 8px',
                  borderRadius: 999,
                  background: COLORS.green
                }}
              />
              <h3 style={{ fontWeight: 800 }}>Family</h3>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>₹499</div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  marginTop: 12,
                  color: 'rgba(15,23,36,0.7)'
                }}
              >
                <li>Up to 6 profiles</li>
                <li>Shared vault</li>
              </ul>

              <button
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(15,23,36,0.06)',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            padding: '28px 24px',
            borderTop: '1px solid rgba(15,23,36,0.04)',
            marginTop: 24
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={logoImage}
                alt="Vytara Logo"
                style={{ width: 22, height: 22, objectFit: 'contain' }}
              />
              <div style={{ fontWeight: 800, color: COLORS.slate }}>Vytara</div>
            </div>

            <div style={{ color: 'rgba(15,23,36,0.6)' }}>
              © {new Date().getFullYear()} Vytara Health Inc.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}