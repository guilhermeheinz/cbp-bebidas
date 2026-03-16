/**
 * ============================================
 * CBP BEBIDAS - CONFIGURAÇÃO DE GRÁFICOS v2.0
 * ============================================
 */

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

const CHART_COLORS = {
    primary: '#FFD700',
    primaryAlpha: 'rgba(255, 215, 0, 0.2)',
    secondary: '#1a1a1a',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    purple: '#6f42c1',
    orange: '#fd7e14',
    pink: '#e83e8c',
    cyan: '#20c997',
    white: '#ffffff',
    gray: '#666666',
    text: '#e0e0e0'
};

Chart.defaults.color = CHART_COLORS.text;
Chart.defaults.borderColor = '#333333';
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

// ============================================
// INSTÂNCIAS DOS GRÁFICOS
// ============================================

let graficoVendas = null;      // Gráfico principal com seletor
let graficoDiario = null;      // Legado mantido
let graficoSemanal = null;
let graficoMensal = null;
let graficoPagamentos = null;  // Pizza de formas de pagamento

// Período atual do seletor
let periodoAtual = 'diario';

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getUltimosDias(dias) {
    const datas = [];
    for (let i = dias - 1; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        datas.push(data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    }
    return datas;
}

function getDiasSemana() {
    return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
}

function getMeses() {
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
}

function agruparVendasPorData(vendas) {
    const agrupado = {};
    vendas.forEach(venda => {
        const data = venda.dataCurta;
        if (!agrupado[data]) agrupado[data] = 0;
        agrupado[data] += venda.valor;
    });
    return agrupado;
}

function agruparVendasPorDiaSemana(vendas) {
    const dias = [0, 0, 0, 0, 0, 0, 0];
    vendas.forEach(venda => {
        const diaSemana = new Date(venda.data).getDay();
        dias[diaSemana] += venda.valor;
    });
    return dias;
}

function agruparVendasPorMes(vendas) {
    const meses = new Array(12).fill(0);
    vendas.forEach(venda => {
        meses[new Date(venda.data).getMonth()] += venda.valor;
    });
    return meses;
}

// ============================================
// GRÁFICO PRINCIPAL COM SELETOR
// ============================================

/**
 * Cria o gráfico de vendas com seletor de período
 * Renderiza no canvas #graficoVendasPrincipal
 */
function criarGraficoVendasComSeletor(periodo = 'diario') {
    const ctx = document.getElementById('graficoVendasPrincipal');
    if (!ctx) return;

    periodoAtual = periodo;

    let labels = [];
    let dados = [];
    let titulo = '';

    if (periodo === 'diario') {
        const hoje = new Date();
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(hoje.getDate() - 7);
        const vendas = getVendas().filter(v => {
            const dv = new Date(v.data);
            return dv >= seteDiasAtras && !v.cancelada;
        });
        labels = getUltimosDias(7);
        const agrupado = agruparVendasPorData(vendas);
        dados = labels.map((_, i) => {
            const data = new Date();
            data.setDate(data.getDate() - (6 - i));
            return agrupado[data.toISOString().split('T')[0]] || 0;
        });
        titulo = 'Vendas dos Últimos 7 Dias';

    } else if (periodo === 'semanal') {
        labels = getDiasSemana();
        dados = agruparVendasPorDiaSemana(getVendasSemana());
        titulo = 'Vendas por Dia da Semana Atual';

    } else if (periodo === 'mensal') {
        labels = getMeses();
        const anoAtual = new Date().getFullYear();
        const vendas = getVendas().filter(v => {
            return new Date(v.data).getFullYear() === anoAtual && !v.cancelada;
        });
        dados = agruparVendasPorMes(vendas);
        titulo = `Vendas Mensais ${anoAtual}`;
    }

    if (graficoVendas) {
        graficoVendas.destroy();
        graficoVendas = null;
    }

    const tipo = periodo === 'semanal' ? 'bar' : 'line';

    graficoVendas = new Chart(ctx, {
        type: tipo,
        data: {
            labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: dados,
                borderColor: CHART_COLORS.primary,
                backgroundColor: tipo === 'bar'
                    ? [CHART_COLORS.primary, CHART_COLORS.info, CHART_COLORS.success,
                       CHART_COLORS.warning, CHART_COLORS.purple, CHART_COLORS.orange, CHART_COLORS.danger]
                    : CHART_COLORS.primaryAlpha,
                borderWidth: tipo === 'bar' ? 1 : 3,
                fill: tipo !== 'bar',
                tension: 0.4,
                pointBackgroundColor: CHART_COLORS.primary,
                pointBorderColor: CHART_COLORS.white,
                pointBorderWidth: 2,
                pointRadius: tipo === 'bar' ? 0 : 5,
                pointHoverRadius: 7,
                borderRadius: tipo === 'bar' ? 5 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: titulo,
                    color: CHART_COLORS.primary,
                    font: { size: 14, weight: 'bold' }
                },
                tooltip: {
                    backgroundColor: CHART_COLORS.secondary,
                    titleColor: CHART_COLORS.primary,
                    bodyColor: CHART_COLORS.text,
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: ctx => 'Vendas: ' + formatarMoeda(ctx.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#333333' },
                    ticks: { callback: v => 'R$ ' + v.toFixed(0) }
                },
                x: {
                    grid: { color: tipo === 'bar' ? 'transparent' : '#333333' }
                }
            }
        }
    });
}

// ============================================
// GRÁFICO PIZZA - FORMAS DE PAGAMENTO
// ============================================

/**
 * Cria o gráfico de pizza com formas de pagamento no dashboard
 */
function criarGraficoPizzaPagamentos() {
    const ctx = document.getElementById('graficoPizzaPagamentos');
    if (!ctx) return;

    // Calcula totais por forma de pagamento das vendas de hoje
    const vendasHoje = getVendasHoje();
    const totais = { dinheiro: 0, debito: 0, credito: 0, pix: 0, fiado: 0 };
    vendasHoje.forEach(v => {
        if (totais[v.formaPagamento] !== undefined) {
            totais[v.formaPagamento] += v.valor;
        }
    });

    const totalGeral = Object.values(totais).reduce((a, b) => a + b, 0);

    if (graficoPagamentos) {
        graficoPagamentos.destroy();
        graficoPagamentos = null;
    }

    // Se não houver vendas hoje, exibe mensagem
    if (totalGeral === 0) {
        const container = ctx.parentElement;
        if (container) {
            const msg = container.querySelector('.sem-dados-pizza');
            if (!msg) {
                const div = document.createElement('div');
                div.className = 'sem-dados-pizza';
                div.style.cssText = 'text-align:center;color:#666;padding:20px;font-size:0.9rem;';
                div.textContent = 'Nenhuma venda hoje';
                container.appendChild(div);
            }
        }
        ctx.style.display = 'none';
        return;
    }

    // Remove mensagem de sem dados se existir
    const msg = ctx.parentElement && ctx.parentElement.querySelector('.sem-dados-pizza');
    if (msg) msg.remove();
    ctx.style.display = 'block';

    graficoPagamentos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Dinheiro', 'Débito', 'Crédito', 'Pix', 'Fiado (dívidas)'],
            datasets: [{
                data: [totais.dinheiro, totais.debito, totais.credito, totais.pix, totais.fiado],
                backgroundColor: [
                    CHART_COLORS.success,
                    CHART_COLORS.info,
                    CHART_COLORS.primary,
                    CHART_COLORS.purple,
                    CHART_COLORS.danger
                ],
                borderColor: CHART_COLORS.secondary,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 12, usePointStyle: true, color: CHART_COLORS.text }
                },
                tooltip: {
                    backgroundColor: CHART_COLORS.secondary,
                    titleColor: CHART_COLORS.primary,
                    bodyColor: CHART_COLORS.text,
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: ctx => {
                            const pct = totalGeral > 0 ? ((ctx.parsed / totalGeral) * 100).toFixed(1) : 0;
                            return `${ctx.label}: ${formatarMoeda(ctx.parsed)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// GRÁFICOS LEGADOS (mantidos para compatibilidade)
// ============================================

function criarGraficoDiario() {
    const ctx = document.getElementById('graficoDiario');
    if (!ctx) return;

    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);

    const vendas = getVendas().filter(v => new Date(v.data) >= seteDiasAtras && !v.cancelada);
    const labels = getUltimosDias(7);
    const agrupado = agruparVendasPorData(vendas);
    const dados = labels.map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return agrupado[d.toISOString().split('T')[0]] || 0;
    });

    if (graficoDiario) { graficoDiario.destroy(); graficoDiario = null; }

    graficoDiario = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: dados,
                borderColor: CHART_COLORS.primary,
                backgroundColor: CHART_COLORS.primaryAlpha,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: CHART_COLORS.primary,
                pointBorderColor: CHART_COLORS.white,
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: CHART_COLORS.secondary,
                    titleColor: CHART_COLORS.primary,
                    bodyColor: CHART_COLORS.text,
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: { label: ctx => 'Vendas: ' + formatarMoeda(ctx.parsed.y) }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#333333' }, ticks: { callback: v => 'R$ ' + v.toFixed(0) } },
                x: { grid: { color: '#333333' } }
            }
        }
    });
}

function criarGraficoSemanal() {
    const ctx = document.getElementById('graficoSemanal');
    if (!ctx) return;

    const vendas = getVendasSemana();
    const labels = getDiasSemana();
    const dados = agruparVendasPorDiaSemana(vendas);

    if (graficoSemanal) { graficoSemanal.destroy(); graficoSemanal = null; }

    graficoSemanal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: dados,
                backgroundColor: [CHART_COLORS.primary, CHART_COLORS.info, CHART_COLORS.success,
                    CHART_COLORS.warning, CHART_COLORS.purple, CHART_COLORS.orange, CHART_COLORS.danger],
                borderColor: CHART_COLORS.white,
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: CHART_COLORS.secondary,
                    titleColor: CHART_COLORS.primary,
                    bodyColor: CHART_COLORS.text,
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: { label: ctx => 'Vendas: ' + formatarMoeda(ctx.parsed.y) }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#333333' }, ticks: { callback: v => 'R$ ' + v.toFixed(0) } },
                x: { grid: { display: false } }
            }
        }
    });
}

function criarGraficoMensal() {
    const ctx = document.getElementById('graficoMensal');
    if (!ctx) return;

    const anoAtual = new Date().getFullYear();
    const vendas = getVendas().filter(v => new Date(v.data).getFullYear() === anoAtual && !v.cancelada);
    const labels = getMeses();
    const dados = agruparVendasPorMes(vendas);

    if (graficoMensal) { graficoMensal.destroy(); graficoMensal = null; }

    graficoMensal = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: dados,
                borderColor: CHART_COLORS.primary,
                backgroundColor: ctx2 => {
                    const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    g.addColorStop(0, 'rgba(255,215,0,0.3)');
                    g.addColorStop(1, 'rgba(255,215,0,0)');
                    return g;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: CHART_COLORS.primary,
                pointBorderColor: CHART_COLORS.white,
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: CHART_COLORS.secondary,
                    titleColor: CHART_COLORS.primary,
                    bodyColor: CHART_COLORS.text,
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: { label: ctx => 'Vendas: ' + formatarMoeda(ctx.parsed.y) }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#333333' }, ticks: { callback: v => 'R$ ' + v.toFixed(0) } },
                x: { grid: { color: '#333333' } }
            }
        }
    });
}

// ============================================
// ATUALIZAÇÃO DE TODOS OS GRÁFICOS
// ============================================

function atualizarTodosGraficos() {
    criarGraficoPizzaPagamentos();
}

// ============================================
// GRÁFICO DE PAGAMENTOS (RELATÓRIO CAIXA)
// ============================================

function criarGraficoPagamentos(canvasId, dados) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Dinheiro', 'Débito', 'Crédito', 'Pix', 'Fiado'],
            datasets: [{
                data: [dados.dinheiro || 0, dados.debito || 0, dados.credito || 0, dados.pix || 0, dados.fiado || 0],
                backgroundColor: [CHART_COLORS.success, CHART_COLORS.info, CHART_COLORS.primary, CHART_COLORS.purple, CHART_COLORS.danger],
                borderColor: CHART_COLORS.secondary,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } },
                tooltip: {
                    backgroundColor: CHART_COLORS.secondary,
                    titleColor: CHART_COLORS.primary,
                    bodyColor: CHART_COLORS.text,
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return `${ctx.label}: ${formatarMoeda(ctx.parsed)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoTopProdutos(canvasId, limite = 5) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const produtos = getEstoque()
        .filter(p => p.vendasTotais > 0)
        .sort((a, b) => b.vendasTotais - a.vendasTotais)
        .slice(0, limite);

    if (produtos.length === 0) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: produtos.map(p => `${p.marca} ${p.tipo}`),
            datasets: [{
                label: 'Quantidade Vendida',
                data: produtos.map(p => p.vendasTotais),
                backgroundColor: CHART_COLORS.primary,
                borderColor: CHART_COLORS.white,
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: '#333333' } },
                y: { grid: { display: false } }
            }
        }
    });
}

// ============================================
// GRÁFICOS DA ABA GESTÃO (Management)
// ============================================

let graficoGestaoMargem = null;
let graficoGestaoReceitaCusto = null;
let graficoGestaoDistribuicao = null;

function criarGraficosGestao(dados) {
    if (!dados || !dados.vendas) return;
    const vendas = dados.vendas;
    const mesesLabels = getMeses();
    const agora = new Date();
    const ultimos6 = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        ultimos6.push({ ano: d.getFullYear(), mes: d.getMonth(), label: mesesLabels[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2) });
    }
    const receitaPorMes = ultimos6.map(() => 0);
    const custoPorMes = ultimos6.map(() => 0);
    vendas.forEach(v => {
        if (!v.itens || !v.itens.length) return;
        const d = new Date(v.data);
        const idx = ultimos6.findIndex(p => p.ano === d.getFullYear() && p.mes === d.getMonth());
        if (idx === -1) return;
        let custoVenda = 0;
        let receitaVenda = 0;
        v.itens.forEach(item => {
            const preco = item.preco || 0;
            const qty = item.quantidade || 1;
            receitaVenda += preco * qty;
            const custoUnit = item.custo != null ? item.custo : 0;
            let un = qty;
            if (item.tipo === 'cigarro' && (item.modalidade === 'carteira' || item.modalidade === 'pacote')) un = qty * 20;
            else if (item.tipo === 'cigarro' && item.modalidade === 'maco') un = qty * 200;
            else if (item.tipo === 'bebida' && item.modalidade === 'caixa') un = qty * (getBebida(item.id)?.unidadesPorCaixa || 12);
            custoVenda += un * custoUnit;
        });
        receitaPorMes[idx] += receitaVenda;
        custoPorMes[idx] += custoVenda;
    });
    const margemPorMes = receitaPorMes.map((r, i) => r > 0 ? ((r - custoPorMes[i]) / r * 100) : 0);

    const ctxMargem = document.getElementById('graficoGestaoMargem');
    if (ctxMargem) {
        if (graficoGestaoMargem) { graficoGestaoMargem.destroy(); graficoGestaoMargem = null; }
        graficoGestaoMargem = new Chart(ctxMargem, {
            type: 'bar',
            data: {
                labels: ultimos6.map(p => p.label),
                datasets: [{
                    label: 'Margem %',
                    data: margemPorMes,
                    backgroundColor: CHART_COLORS.primaryAlpha,
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: ctx => 'Margem: ' + ctx.parsed.y.toFixed(1) + '%' }
                    }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: '#333333' }, ticks: { callback: v => v + '%' } },
                    x: { grid: { color: '#333333' } }
                }
            }
        });
    }

    const ctxRC = document.getElementById('graficoGestaoReceitaCusto');
    if (ctxRC) {
        if (graficoGestaoReceitaCusto) { graficoGestaoReceitaCusto.destroy(); graficoGestaoReceitaCusto = null; }
        graficoGestaoReceitaCusto = new Chart(ctxRC, {
            type: 'bar',
            data: {
                labels: ultimos6.map(p => p.label),
                datasets: [
                    { label: 'Receita', data: receitaPorMes, backgroundColor: CHART_COLORS.success, borderColor: CHART_COLORS.white, borderWidth: 1, borderRadius: 5 },
                    { label: 'Custo', data: custoPorMes, backgroundColor: CHART_COLORS.danger, borderColor: CHART_COLORS.white, borderWidth: 1, borderRadius: 5 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: { label: ctx => ctx.dataset.label + ': ' + formatarMoeda(ctx.parsed.y) }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#333333' }, ticks: { callback: v => 'R$ ' + v.toFixed(0) } },
                    x: { grid: { color: '#333333' } }
                }
            }
        });
    }

    let distCigarro = 0, distBebida = 0, distMercearia = 0;
    vendas.forEach(v => {
        if (!v.itens) return;
        v.itens.forEach(item => {
            const val = (item.preco || 0) * (item.quantidade || 1);
            if (item.tipo === 'cigarro') distCigarro += val;
            else if (item.tipo === 'bebida') distBebida += val;
            else distMercearia += val;
        });
    });
    const totaisDist = [distCigarro, distBebida, distMercearia];
    const ctxDist = document.getElementById('graficoGestaoDistribuicao');
    if (ctxDist) {
        if (graficoGestaoDistribuicao) { graficoGestaoDistribuicao.destroy(); graficoGestaoDistribuicao = null; }
        graficoGestaoDistribuicao = new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: ['Cigarros', 'Bebidas', 'Mercearia'],
                datasets: [{
                    data: totaisDist,
                    backgroundColor: [CHART_COLORS.primary, CHART_COLORS.info, CHART_COLORS.success],
                    borderColor: CHART_COLORS.secondary,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 12 } },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const total = totaisDist.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                return ctx.label + ': ' + formatarMoeda(ctx.parsed) + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
}
