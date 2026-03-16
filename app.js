/**
 * ============================================
 * CBP BEBIDAS - APLICAÇÃO PRINCIPAL v2.0
 * ============================================
 *
 * Melhorias implementadas:
 * - Integração de vendas com estoque
 * - Sistema de desconto na venda
 * - Atalhos de teclado: 1=dinheiro, 2=débito, 3=crédito, 4=pix, 5=fiado
 * - Botão tela cheia
 * - Gráfico pizza com formas de pagamento
 * - Gráfico de vendas com seletor (diário, semanal, mensal)
 * - Alerta de estoque baixo
 * - Sistema de venda por unidade e caixa de cerveja
 */

// ============================================
// VARIÁVEIS GLOBAIS E ESTADO
// ============================================

let estadoAtual = {
    abaAtiva: 'dashboard',
    formaPagamentoSelecionada: null,
    clienteSelecionado: null,
    itensPedido: []   // Lista de itens na venda atual
};

// ============================================
// FUNÇÕES UTILITÁRIAS DE UI
// ============================================

function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    const icones = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    toast.innerHTML = `
        <i class="fas fa-${icones[tipo] || 'info-circle'}"></i>
        <span>${mensagem}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duracao);
}

function atualizarRelogio() {
    const agora = new Date();
    const dataEl = document.getElementById('currentDate');
    const horaEl = document.getElementById('currentTime');

    if (dataEl) {
        dataEl.textContent = agora.toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
    if (horaEl) {
        horaEl.textContent = agora.toLocaleTimeString('pt-BR');
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// ============================================
// TELA CHEIA
// ============================================

function inicializarTelaCheia() {
    const btn = document.getElementById('btnFullscreen');
    if (!btn) return;

    btn.addEventListener('click', toggleTelaCheia);

    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        btn.innerHTML = isFullscreen
            ? '<i class="fas fa-compress"></i> Sair'
            : '<i class="fas fa-expand"></i> Tela Cheia';
    });
}

function toggleTelaCheia() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            mostrarToast('Não foi possível ativar tela cheia: ' + err.message, 'warning');
        });
    } else {
        document.exitFullscreen();
    }
}

// ============================================
// ATALHOS DE TECLADO
// ============================================

function inicializarAtalhos() {
    document.addEventListener('keydown', (e) => {
        // Ignora se estiver digitando em um input/textarea
        const tag = document.activeElement.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        const abaVendas = estadoAtual.abaAtiva === 'vendas';

        switch (e.key) {
            case '1':
                if (abaVendas) selecionarPagamentoPorAtalho('dinheiro');
                break;
            case '2':
                if (abaVendas) selecionarPagamentoPorAtalho('debito');
                break;
            case '3':
                if (abaVendas) selecionarPagamentoPorAtalho('credito');
                break;
            case '4':
                if (abaVendas) selecionarPagamentoPorAtalho('pix');
                break;
            case '5':
                if (abaVendas) selecionarPagamentoPorAtalho('fiado');
                break;
            case 'Enter':
                if (abaVendas) {
                    e.preventDefault();
                    registrarVenda();
                }
                break;
            case 'F11':
                e.preventDefault();
                toggleTelaCheia();
                break;
            case 'Escape':
                // Fecha modais abertos
                document.querySelectorAll('.modal').forEach(m => {
                    if (m.style.display !== 'none') m.style.display = 'none';
                });
                break;
        }
    });
}

function selecionarPagamentoPorAtalho(pagamento) {
    const btn = document.querySelector(`.btn-payment[data-payment="${pagamento}"]`);
    if (btn) {
        btn.click();
        mostrarToast(`Pagamento: ${pagamento.toUpperCase()} (atalho)`, 'info', 1500);
    }
}

// ============================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================

function inicializarNavegacao() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');

    const titulos = {
        dashboard: 'Dashboard Geral',
        vendas: 'Vendas',
        caixa: 'Controle de Caixa',
        fiado: 'Controle de Fiado',
        gestao: 'Gestão'
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            const tab = document.getElementById(tabId);
            if (tab) tab.classList.add('active');
            if (pageTitle) pageTitle.textContent = titulos[tabId] || tabId;
            estadoAtual.abaAtiva = tabId;
            if (tabId === 'gestao') {
                const gate = document.getElementById('gestaoGate');
                const conteudo = document.getElementById('gestaoConteudo');
                if (gate) gate.style.display = 'block';
                if (conteudo) conteudo.style.display = 'none';
            }
            atualizarAba(tabId);
        });
    });

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }
}

function atualizarAba(tabId) {
    switch (tabId) {
        case 'dashboard': atualizarDashboard(); break;
        case 'vendas': atualizarTabelaVendas(); atualizarSelectClientes(); break;
        case 'caixa': atualizarTelaCaixa(); break;
        case 'fiado': atualizarTelaFiado(); break;
        case 'estoque': atualizarTelaEstoque(); break;
        case 'bebidas': atualizarTelaBebidas(); break;
        case 'mercearia': atualizarTelaMercearia(); break;
        case 'fornecedores': atualizarTabelaFornecedores(); if (typeof atualizarCarteiraFornecedores === 'function') atualizarCarteiraFornecedores(); break;
        case 'historico': atualizarTabelaHistorico(); break;
        case 'gestao': break;
    }
}

// ============================================
// DASHBOARD
// ============================================

// Período de lucro exibido no dashboard (hoje | semana | mes)
let periodoLucroAtual = 'hoje';

function atualizarDashboard() {
    const elHoje = document.getElementById('vendaHoje');
    if (elHoje) elHoje.textContent = formatarMoeda(typeof getReceitaHoje === 'function' ? getReceitaHoje() : 0);
    atualizarTodosGraficos();
}

function inicializarBotoesLucro() {
    document.querySelectorAll('.btn-profit').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-profit').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            periodoLucroAtual = btn.dataset.profit;
            const lucro = periodoLucroAtual === 'hoje' ? getLucroHoje() : periodoLucroAtual === 'semana' ? getLucroSemana() : getLucroMes();
            const el = document.getElementById('valorLucroPeriodo');
            if (el) el.textContent = formatarMoeda(lucro);
        });
    });
}

function atualizarAlertasEstoque() {
    const produtosBaixo = getProdutosEstoqueBaixo();
    const alertSection = document.getElementById('alertasEstoque');
    const alertList = document.getElementById('listaAlertas');

    if (!alertSection || !alertList) return;

    if (produtosBaixo.length > 0) {
        alertSection.style.display = 'block';
        alertList.innerHTML = produtosBaixo.map(p => `
            <div class="alert-item">
                <i class="fas fa-exclamation-circle"></i>
                <strong>${p.marca || p.nome} ${p.tipo || ''}</strong>: ${p.quantidade} unidades restantes
                <span class="badge danger" style="margin-left:8px;">Estoque Baixo</span>
            </div>
        `).join('');
    } else {
        alertSection.style.display = 'none';
    }
}

// ============================================
// SISTEMA DE VENDAS — CARRINHO COM BAIXA DE ESTOQUE
// ============================================

function inicializarVendas() {
    // Pagamento
    document.querySelectorAll('.btn-payment').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-payment').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const forma = btn.dataset.payment;
            estadoAtual.formaPagamentoSelecionada = forma;
            document.getElementById('campoTroco').style.display = forma === 'dinheiro' ? 'block' : 'none';
            document.getElementById('campoFiado').style.display = forma === 'fiado' ? 'block' : 'none';
        });
    });

    // Troco e desconto
    const valorVendaEl = document.getElementById('valorVenda');
    const valorPagoEl = document.getElementById('valorPago');
    const descontoEl = document.getElementById('descontoVenda');

    function recalcular() {
        const venda = parseFloat(valorVendaEl.value) || 0;
        const desconto = parseFloat(descontoEl ? descontoEl.value : 0) || 0;
        const pago = parseFloat(valorPagoEl.value) || 0;
        const final = Math.max(0, venda - desconto);
        const troco = pago - final;
        const trocoEl = document.getElementById('valorTroco');
        if (trocoEl) trocoEl.textContent = formatarMoeda(troco > 0 ? troco : 0);
        const valorFinalEl = document.getElementById('valorFinalComDesconto');
        if (valorFinalEl && desconto > 0) valorFinalEl.textContent = `Valor final: ${formatarMoeda(final)}`;
        else if (valorFinalEl) valorFinalEl.textContent = '';
    }

    valorVendaEl.addEventListener('input', recalcular);
    valorPagoEl.addEventListener('input', recalcular);
    if (descontoEl) descontoEl.addEventListener('input', recalcular);

    // Busca de produto
    const buscaEl = document.getElementById('buscaProdutoVenda');
    const resultadosEl = document.getElementById('resultadosBusca');

    let indiceSelecionado = -1;
    let resultadosAtuais = [];

    function renderizarResultados(resultados) {
        resultadosAtuais = resultados;
        indiceSelecionado = -1;
        if (resultados.length === 0) {
            resultadosEl.innerHTML = '<div style="padding:10px 14px;color:#888;font-size:0.85rem;">Nenhum produto encontrado</div>';
        } else {
            resultadosEl.innerHTML = resultados.map((p, idx) => {
                const icone = p._tipo === 'cigarro' ? '🚬' : p._tipo === 'bebida' ? '🍺' : '🏪';
                const estoque = p._estoqueTexto;
                const estoqueColor = p._estoque <= 0 ? '#e55' : p._estoque <= 10 ? '#f90' : '#5c5';
                const sel = idx === indiceSelecionado ? ' background:#2a2a2a;' : '';
                return `<div class="resultado-produto" data-id="${p._id}" data-tipo="${p._tipo}" data-idx="${idx}"
                    style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #2a2a2a;${sel}
                    display:flex;justify-content:space-between;align-items:center;transition:background .15s;"
                    onmouseover="this.style.background='#2a2a2a'" onmouseout="if(this.getAttribute('data-idx')!==document.getElementById('resultadosBusca').getAttribute('data-selected')) this.style.background=''"
                    onclick="adicionarAoCarrinho('${p._id}','${p._tipo}')">
                        <div>
                            <span style="margin-right:6px;">${icone}</span>
                            <strong style="color:#eee;">${p._nome}</strong>
                            <span style="color:#888;font-size:0.8rem;margin-left:8px;">${p._categoria || ''}</span>
                        </div>
                        <div style="text-align:right;">
                            <span style="color:#f0c040;font-weight:700;">${formatarMoeda(p._preco)}</span>
                            <span style="color:${estoqueColor};font-size:0.75rem;margin-left:8px;">${estoque}</span>
                        </div>
                    </div>`;
            }).join('');
        }
        resultadosEl.style.display = 'block';
    }

    buscaEl.addEventListener('input', () => {
        const termo = buscaEl.value.trim().toLowerCase();
        if (termo.length < 1) { resultadosEl.style.display = 'none'; resultadosAtuais = []; return; }

        const resultados = buscarProdutosTodos(termo);
        renderizarResultados(resultados);
    });

    buscaEl.addEventListener('keydown', (e) => {
        if (resultadosEl.style.display !== 'block' || resultadosAtuais.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            indiceSelecionado = (indiceSelecionado + 1) % resultadosAtuais.length;
            resultadosEl.setAttribute('data-selected', indiceSelecionado);
            resultadosEl.querySelectorAll('.resultado-produto').forEach((el, i) => {
                el.style.background = i === indiceSelecionado ? '#2a2a2a' : '';
            });
            resultadosEl.querySelectorAll('.resultado-produto')[indiceSelecionado]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            indiceSelecionado = indiceSelecionado <= 0 ? resultadosAtuais.length - 1 : indiceSelecionado - 1;
            resultadosEl.setAttribute('data-selected', indiceSelecionado);
            resultadosEl.querySelectorAll('.resultado-produto').forEach((el, i) => {
                el.style.background = i === indiceSelecionado ? '#2a2a2a' : '';
            });
            resultadosEl.querySelectorAll('.resultado-produto')[indiceSelecionado]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && indiceSelecionado >= 0 && resultadosAtuais[indiceSelecionado]) {
            e.preventDefault();
            const p = resultadosAtuais[indiceSelecionado];
            adicionarAoCarrinho(String(p._id), p._tipo);
            resultadosEl.style.display = 'none';
            buscaEl.value = '';
            resultadosAtuais = [];
        }
    });

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', e => {
        if (!buscaEl.contains(e.target) && !resultadosEl.contains(e.target)) {
            resultadosEl.style.display = 'none';
        }
    });

    document.getElementById('btnRegistrarVenda').addEventListener('click', registrarVenda);
    document.getElementById('btnLimparVenda').addEventListener('click', limparFormularioVenda);

    const seletorPeriodo = document.getElementById('seletorPeriodoVendas');
    if (seletorPeriodo) {
        seletorPeriodo.addEventListener('change', () => criarGraficoVendasComSeletor(seletorPeriodo.value));
    }
}

/** Busca em todos os estoques pelo termo */
function buscarProdutosTodos(termo) {
    const resultados = [];

    // Cigarros
    getEstoque().forEach(p => {
        const nome = `${p.marca} ${p.tipo}`.toLowerCase();
        if (nome.includes(termo)) {
            resultados.push({
                _id: p.id, _tipo: 'cigarro',
                _nome: `${p.marca} ${p.tipo}`,
                _preco: p.valorVenda || 0,
                _categoria: p.marca,
                _estoque: p.quantidade || 0,
                _estoqueTexto: `${p.quantidade || 0} un`
            });
        }
    });

    // Bebidas
    getBebidas().forEach(b => {
        if (b.nome.toLowerCase().includes(termo)) {
            const totalUn = (b.quantidadeUnidades || 0) + (b.quantidadeCaixas || 0) * (b.unidadesPorCaixa || 24);
            resultados.push({
                _id: b.id, _tipo: 'bebida',
                _nome: b.nome,
                _preco: b.valorVendaUnidade || 0,
                _categoria: b.categoria || 'bebida',
                _estoque: totalUn,
                _estoqueTexto: `${b.quantidadeCaixas || 0}cx + ${b.quantidadeUnidades || 0}un`
            });
        }
    });

    // Mercearia
    getMercearia().forEach(i => {
        if (i.nome.toLowerCase().includes(termo)) {
            resultados.push({
                _id: i.id, _tipo: 'mercearia',
                _nome: i.nome,
                _preco: i.valorVenda || 0,
                _categoria: i.categoria || 'mercearia',
                _estoque: i.quantidade || 0,
                _estoqueTexto: `${i.quantidade || 0} un`
            });
        }
    });

    return resultados.slice(0, 10);
}

/** Adiciona item ao carrinho */
function adicionarAoCarrinho(id, tipo) {
    const idNum = parseInt(id);
    const existente = estadoAtual.itensPedido.find(i => i.id === idNum && i.tipo === tipo);

    if (existente) {
        existente.quantidade += 1;
    } else {
        let nome = '', preco = 0, estoque = 0;

        let custo = 0;
        if (tipo === 'cigarro') {
            const p = getProduto(idNum);
            if (!p) return;
            nome = `${p.marca} ${p.tipo}`;
            preco = p.valorVenda || 0;
            // valorCustoCarteira agora representa custo por MAÇO (200 unidades)
            custo = (p.valorCustoCarteira || p.valorCusto || 0) / 200;
            estoque = typeof getTotalUnidadesCigarro === 'function' ? getTotalUnidadesCigarro(p) : (p.quantidade || 0);
        } else if (tipo === 'bebida') {
            const b = getBebida(idNum);
            if (!b) return;
            nome = b.nome;
            preco = b.valorVendaUnidade || 0;
            custo = b.valorCustoUnidade || 0;
            estoque = (b.quantidadeUnidades || 0) + (b.quantidadeCaixas || 0) * (b.unidadesPorCaixa || 24) + (b.quantidadePacotes || 0) * (b.unidadesPorPacote || 6);
        } else if (tipo === 'mercearia') {
            const m = getItemMercearia(idNum);
            if (!m) return;
            nome = m.nome;
            preco = m.valorVenda || 0;
            custo = m.valorCusto || 0;
            estoque = m.quantidade || 0;
        }

        if (estoque <= 0) {
            mostrarToast(`"${nome}" sem estoque!`, 'error');
            return;
        }

        estadoAtual.itensPedido.push({ id: idNum, tipo, nome, preco, quantidade: 1, estoqueMax: estoque, modalidade: 'unidade', custo });
    }

    // Fecha dropdown e limpa busca
    document.getElementById('resultadosBusca').style.display = 'none';
    document.getElementById('buscaProdutoVenda').value = '';

    renderizarCarrinho();
    mostrarToast(`${tipo === 'cigarro' ? '🚬' : tipo === 'bebida' ? '🍺' : '🏪'} Adicionado ao carrinho!`, 'success', 1200);
}

/** Renderiza o carrinho e atualiza o valor total */
function renderizarCarrinho() {
    const itens = estadoAtual.itensPedido;
    const carrinhoDiv = document.getElementById('carrinhoVenda');
    const listaDiv = document.getElementById('listaCarrinho');
    const subtotalEl = document.getElementById('subtotalCarrinho');
    const valorVendaEl = document.getElementById('valorVenda');

    if (itens.length === 0) {
        carrinhoDiv.style.display = 'none';
        return;
    }

    carrinhoDiv.style.display = 'block';
    const icones = { cigarro: '🚬', bebida: '🍺', mercearia: '🏪' };

    listaDiv.innerHTML = itens.map((item, idx) => {
        const mod = item.modalidade || 'unidade';
        const labelMod = (mod === 'carteira' || mod === 'pacote') ? 'cart' : mod === 'caixa' ? 'cx' : 'un';
        let botoesMod = '';
        if (item.tipo === 'cigarro') {
            const p = getProduto(item.id);
            if (p) {
                const isCart = mod === 'carteira' || mod === 'pacote';
                botoesMod = `<span class="cart-mod-btns"><button type="button" class="btn-mod ${mod==='unidade'?'active':''}" onclick="trocarModalidadeCarrinho(${idx},'unidade')">Unidade</button><button type="button" class="btn-mod ${isCart?'active':''}" onclick="trocarModalidadeCarrinho(${idx},'carteira')">Carteira</button></span>`;
            }
        } else if (item.tipo === 'bebida') {
            const b = getBebida(item.id);
            if (b) {
                const hasCaixa = (b.unidadesPorCaixa || 0) > 0;
                const hasPacote = (b.unidadesPorPacote || 0) > 0;
                if (hasCaixa || hasPacote) {
                    botoesMod = `<span class="cart-mod-btns"><button type="button" class="btn-mod ${mod==='unidade'?'active':''}" onclick="trocarModalidadeCarrinho(${idx},'unidade')">Un</button>${hasCaixa ? `<button type="button" class="btn-mod ${mod==='caixa'?'active':''}" onclick="trocarModalidadeCarrinho(${idx},'caixa')">Cx</button>` : ''}${hasPacote ? `<button type="button" class="btn-mod ${mod==='pacote'?'active':''}" onclick="trocarModalidadeCarrinho(${idx},'pacote')">Pac</button>` : ''}</span>`;
                }
            }
        }
        return `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1a1a1a;border-radius:7px;border:1px solid #2d2d2d;flex-wrap:wrap;">
            <span style="font-size:1rem;">${icones[item.tipo] || '📦'}</span>
            <span style="flex:1;min-width:80px;font-size:0.88rem;color:#ddd;">${item.nome}</span>
            ${botoesMod}
            <span style="color:#f0c040;font-size:0.82rem;min-width:60px;text-align:right;">${formatarMoeda(item.preco)}/${labelMod}</span>
            <div style="display:flex;align-items:center;gap:4px;">
                <button onclick="alterarQtdCarrinho(${idx},-1)" style="width:26px;height:26px;border-radius:50%;background:#333;border:1px solid #555;color:#fff;cursor:pointer;font-size:1rem;line-height:1;">−</button>
                <span style="min-width:24px;text-align:center;font-weight:700;color:#fff;">${item.quantidade}</span>
                <button onclick="alterarQtdCarrinho(${idx},1)" style="width:26px;height:26px;border-radius:50%;background:#333;border:1px solid #555;color:#fff;cursor:pointer;font-size:1rem;line-height:1;">+</button>
            </div>
            <span style="min-width:70px;text-align:right;font-weight:700;color:#fff;">${formatarMoeda(item.preco * item.quantidade)}</span>
            <button onclick="removerDoCarrinho(${idx})" style="background:none;border:none;color:#e55;cursor:pointer;font-size:0.9rem;padding:2px;">✕</button>
        </div>
    `;
    }).join('');

    const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    subtotalEl.textContent = formatarMoeda(subtotal);

    // Atualiza campo de valor automaticamente
    valorVendaEl.value = subtotal.toFixed(2);
    valorVendaEl.dispatchEvent(new Event('input'));
}

function trocarModalidadeCarrinho(idx, modalidade) {
    const item = estadoAtual.itensPedido[idx];
    if (!item) return;
    item.modalidade = modalidade;
    if (item.tipo === 'cigarro') {
        const p = getProduto(item.id);
        if (p) {
            const isCarteira = modalidade === 'carteira' || modalidade === 'pacote';
            item.preco = isCarteira ? (p.valorVendaCarteira || p.valorVendaPacote || 0) : (p.valorVenda || 0);
            const totalUn = typeof getTotalUnidadesCigarro === 'function' ? getTotalUnidadesCigarro(p) : (p.quantidade || 0);
            item.estoqueMax = isCarteira ? Math.floor(totalUn / 20) : totalUn;
        }
    } else if (item.tipo === 'bebida') {
        const b = getBebida(item.id);
        if (b) {
            const unCx = b.unidadesPorCaixa || 24;
            const unPac = b.unidadesPorPacote || 6;
            const totalUn = (b.quantidadeUnidades || 0) + (b.quantidadeCaixas || 0) * unCx + (b.quantidadePacotes || 0) * unPac;
            if (modalidade === 'caixa') {
                item.preco = b.valorVendaCaixa || 0;
                item.estoqueMax = Math.floor(totalUn / unCx);
            } else if (modalidade === 'pacote' && unPac > 0) {
                item.preco = b.valorVendaPacote || 0;
                item.estoqueMax = Math.floor(totalUn / unPac);
            } else {
                item.preco = b.valorVendaUnidade || 0;
                item.estoqueMax = totalUn;
            }
        }
    }
    if ((item.quantidade || 1) > item.estoqueMax) item.quantidade = Math.max(1, item.estoqueMax);
    renderizarCarrinho();
}

function alterarQtdCarrinho(idx, delta) {
    const item = estadoAtual.itensPedido[idx];
    if (!item) return;
    const novaQtd = item.quantidade + delta;
    if (novaQtd <= 0) {
        removerDoCarrinho(idx);
        return;
    }
    if (novaQtd > item.estoqueMax) {
        mostrarToast(`Estoque máximo: ${item.estoqueMax} ${(item.modalidade || 'unidade') === 'pacote' ? 'pac' : (item.modalidade === 'caixa' ? 'cx' : 'un')}`, 'warning');
        return;
    }
    item.quantidade = novaQtd;
    renderizarCarrinho();
}

function removerDoCarrinho(idx) {
    estadoAtual.itensPedido.splice(idx, 1);
    renderizarCarrinho();
}

function limparCarrinho() {
    estadoAtual.itensPedido = [];
    renderizarCarrinho();
    document.getElementById('valorVenda').value = '';
    document.getElementById('valorFinalComDesconto').textContent = '';
}

function registrarVenda() {
    const valor = parseFloat(document.getElementById('valorVenda').value);
    const formaPagamento = estadoAtual.formaPagamentoSelecionada;
    const descontoEl = document.getElementById('descontoVenda');
    const desconto = descontoEl ? (parseFloat(descontoEl.value) || 0) : 0;

    if (!valor || valor <= 0) {
        mostrarToast('Digite um valor ou adicione produtos ao carrinho!', 'error');
        return;
    }
    if (!formaPagamento) {
        mostrarToast('Selecione uma forma de pagamento! (Atalhos: 1-5)', 'error');
        return;
    }
    if (desconto >= valor) {
        mostrarToast('Desconto não pode ser maior ou igual ao valor da venda!', 'error');
        return;
    }

    const valorFinal = Math.max(0, valor - desconto);

    const venda = {
        valor,
        desconto,
        formaPagamento,
        itens: estadoAtual.itensPedido.map(i => ({
            id: i.id,
            tipo: i.tipo,
            nome: i.nome,
            quantidade: i.quantidade,
            preco: i.preco,
            modalidade: i.modalidade || 'unidade',
            custo: i.custo
        }))
    };

    if (formaPagamento === 'dinheiro') {
        const valorPago = parseFloat(document.getElementById('valorPago').value) || 0;
        if (valorPago < valorFinal) {
            mostrarToast('Valor pago é menor que o valor final da venda!', 'error');
            return;
        }
        venda.valorPago = valorPago;
        venda.troco = valorPago - valorFinal;
    }

    if (formaPagamento === 'fiado') {
        const clienteId = document.getElementById('selectCliente').value;
        if (!clienteId) {
            mostrarToast('Selecione um cliente para venda fiada!', 'error');
            return;
        }
        const cliente = getCliente(clienteId);
        venda.clienteId = clienteId;
        venda.clienteNome = cliente.nome;
    }

    const novaVenda = adicionarVenda(venda);

    if (formaPagamento === 'fiado' && venda.clienteId) {
        adicionarCompraCliente(venda.clienteId, { valor: valorFinal, vendaId: novaVenda.id });
    }

    const qtdItens = estadoAtual.itensPedido.reduce((s, i) => s + i.quantidade, 0);
    const msgItens = qtdItens > 0 ? ` • ${qtdItens} item(s) baixados do estoque` : '';
    const msgDesconto = desconto > 0 ? ` (desc. ${formatarMoeda(desconto)})` : '';
    mostrarToast(`✅ Venda de ${formatarMoeda(valorFinal)} registrada!${msgDesconto}${msgItens}`, 'success', 4000);

    limparFormularioVenda();
    atualizarTabelaVendas();
    atualizarTelaEstoque();
    atualizarTelaBebidas();
    atualizarTelaMercearia();
    atualizarDashboard();
}

function limparFormularioVenda() {
    document.getElementById('valorVenda').value = '';
    document.getElementById('valorPago').value = '';
    const descontoEl = document.getElementById('descontoVenda');
    if (descontoEl) descontoEl.value = '';
    const trocoEl = document.getElementById('valorTroco');
    if (trocoEl) trocoEl.textContent = 'R$ 0,00';
    const valorFinalEl = document.getElementById('valorFinalComDesconto');
    if (valorFinalEl) valorFinalEl.textContent = '';
    document.getElementById('selectCliente').value = '';
    document.getElementById('saldoAtualCliente').textContent = '';
    document.querySelectorAll('.btn-payment').forEach(btn => btn.classList.remove('active'));
    document.getElementById('campoTroco').style.display = 'none';
    document.getElementById('campoFiado').style.display = 'none';
    estadoAtual.formaPagamentoSelecionada = null;
    estadoAtual.clienteSelecionado = null;
    estadoAtual.itensPedido = [];
    renderizarCarrinho();
}

function atualizarTabelaVendas() {
    const tbody = document.querySelector('#tabelaVendas tbody');
    if (!tbody) return;
    const vendasHoje = getVendasHoje();

    const iconesPagamento = {
        dinheiro: 'money-bill-wave', debito: 'credit-card',
        credito: 'credit-card', pix: 'qrcode', fiado: 'hand-holding-usd'
    };

    tbody.innerHTML = vendasHoje.map(venda => {
        const hora = new Date(venda.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const desconto = venda.desconto > 0
            ? `<br><small class="text-warning">Desc: ${formatarMoeda(venda.desconto)}</small>` : '';

        // Resumo dos itens
        let itensTexto = '-';
        if (venda.itens && venda.itens.length > 0) {
            const icones = { cigarro: '🚬', bebida: '🍺', mercearia: '🏪' };
            itensTexto = venda.itens.map(i =>
                `<span style="font-size:0.78rem;white-space:nowrap;">${icones[i.tipo] || '📦'} ${i.nome} ×${i.quantidade}</span>`
            ).join('<br>');
        }

        const status = venda.cancelada
            ? '<span class="badge danger">Cancelada</span>'
            : '<span class="badge success">OK</span>';

        const acoes = venda.cancelada
            ? '<span style="color:#666;font-size:0.78rem;">—</span>'
            : `<button class="btn btn-sm btn-danger" onclick="cancelarVendaUI('${venda.id}')">
                <i class="fas fa-times"></i> Cancelar
               </button>`;

        return `
            <tr style="${venda.cancelada ? 'opacity:0.5;' : ''}">
                <td>${hora}</td>
                <td>${formatarMoeda(venda.valor)}${desconto}</td>
                <td>
                    <i class="fas fa-${iconesPagamento[venda.formaPagamento]}"></i>
                    ${venda.formaPagamento.toUpperCase()}
                    ${venda.clienteNome ? `<br><small style="color:#aaa;">${venda.clienteNome}</small>` : ''}
                </td>
                <td>${itensTexto}</td>
                <td>${status}</td>
                <td>${acoes}</td>
            </tr>`;
    }).join('');

    const total = typeof getReceitaHoje === 'function' ? getReceitaHoje() : calcularTotalVendas(vendasHoje);
    const totalEl = document.getElementById('totalVendasDia');
    if (totalEl) totalEl.innerHTML = `<strong>${formatarMoeda(total)}</strong> <small style="color:#888;">(receita)</small>`;
}

function cancelarVendaUI(id) {
    if (confirm('Tem certeza que deseja cancelar esta venda?\n\nOs itens serão devolvidos ao estoque.')) {
        if (cancelarVenda(id)) {
            mostrarToast('Venda cancelada — estoque restaurado!', 'success');
            atualizarTabelaVendas();
            atualizarTelaEstoque();
            atualizarTelaBebidas();
            atualizarTelaMercearia();
            atualizarDashboard();
        } else {
            mostrarToast('Erro ao cancelar venda!', 'error');
        }
    }
}

function atualizarSelectClientes() {
    const select = document.getElementById('selectCliente');
    if (!select) return;
    const clientes = getClientes();

    select.innerHTML = '<option value="">Selecione um cliente...</option>' +
        clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    select.addEventListener('change', () => {
        const clienteId = select.value;
        const saldoDiv = document.getElementById('saldoAtualCliente');
        if (clienteId) {
            const cliente = getCliente(clienteId);
            saldoDiv.innerHTML = `Saldo atual: <strong class="${cliente.saldo > 0 ? 'text-danger' : ''}">${formatarMoeda(cliente.saldo)}</strong>`;
        } else {
            saldoDiv.textContent = '';
        }
    });
}

// ============================================
// CONTROLE DE CAIXA
// ============================================

function inicializarCaixa() {
    document.getElementById('btnAbrirCaixa').addEventListener('click', () => {
        document.getElementById('formAbrirCaixa').style.display = 'block';
        document.getElementById('caixaActions').style.display = 'none';
    });

    document.getElementById('btnConfirmarAbertura').addEventListener('click', () => {
        const valorInicial = parseFloat(document.getElementById('valorInicial').value) || 0;
        if (abrirCaixa(valorInicial)) {
            mostrarToast('Caixa aberto com sucesso!', 'success');
            atualizarTelaCaixa();
        } else {
            mostrarToast('Erro ao abrir caixa!', 'error');
        }
    });

    document.getElementById('btnCancelarAbertura').addEventListener('click', () => {
        document.getElementById('formAbrirCaixa').style.display = 'none';
        document.getElementById('caixaActions').style.display = 'flex';
        document.getElementById('valorInicial').value = '';
    });

    document.getElementById('btnRegistrarMovimentacao').addEventListener('click', () => {
        const tipo = document.getElementById('tipoMovimentacao').value;
        const valor = parseFloat(document.getElementById('valorMovimentacao').value);
        const descricao = document.getElementById('descricaoMovimentacao').value;

        if (!valor || valor <= 0) { mostrarToast('Digite um valor válido!', 'error'); return; }
        if (!descricao.trim()) { mostrarToast('Digite uma descrição!', 'error'); return; }

        if (adicionarMovimentacao(tipo, valor, descricao)) {
            mostrarToast('Movimentação registrada!', 'success');
            document.getElementById('valorMovimentacao').value = '';
            document.getElementById('descricaoMovimentacao').value = '';
            atualizarTelaCaixa();
        } else {
            mostrarToast('Erro ao registrar movimentação!', 'error');
        }
    });

    document.getElementById('btnFecharCaixa').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja fechar o caixa?')) {
            const relatorio = fecharCaixa();
            if (relatorio) {
                mostrarToast('Caixa fechado com sucesso!', 'success');
                mostrarRelatorioFechamento(relatorio);
                atualizarTelaCaixa();
            } else {
                mostrarToast('Erro ao fechar caixa!', 'error');
            }
        }
    });
}

function atualizarTelaCaixa() {
    const caixa = getCaixa();
    const statusInfo = document.getElementById('statusInfo');
    const caixaActions = document.getElementById('caixaActions');
    const formAbrir = document.getElementById('formAbrirCaixa');
    const movimentacoes = document.getElementById('caixaMovimentacoes');

    if (caixa.aberto) {
        statusInfo.innerHTML = `
            <p class="status-aberto"><i class="fas fa-lock-open"></i> Caixa Aberto</p>
            <p>Desde: ${formatarDataHora(caixa.dataAbertura)}</p>
        `;
        caixaActions.style.display = 'none';
        formAbrir.style.display = 'none';
        movimentacoes.style.display = 'block';
        atualizarResumoCaixa(caixa);
        atualizarTabelaMovimentacoes(caixa.movimentacoes);
    } else {
        statusInfo.innerHTML = `<p class="status-fechado"><i class="fas fa-lock"></i> Caixa Fechado</p>`;
        caixaActions.style.display = 'flex';
        formAbrir.style.display = 'none';
        movimentacoes.style.display = 'none';
    }
}

function atualizarResumoCaixa(caixa) {
    const vendasCaixa = getVendas().filter(v => caixa.vendas.includes(v.id) && !v.cancelada);
    const totais = { dinheiro: 0, debito: 0, credito: 0, pix: 0, fiado: 0 };
    vendasCaixa.forEach(v => {
        if (totais[v.formaPagamento] !== undefined) totais[v.formaPagamento] += v.valor;
    });
    const fiadoDividasHoje = typeof getFiadoVendasHoje === 'function' ? getFiadoVendasHoje() : 0;
    totais.fiado = fiadoDividasHoje;

    const entradas = caixa.movimentacoes.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
    const retiradas = caixa.movimentacoes.filter(m => m.tipo === 'retirada').reduce((s, m) => s + m.valor, 0);
    const receitaVendas = vendasCaixa.filter(v => v.formaPagamento !== 'fiado').reduce((s, v) => s + v.valor, 0);
    const pagamentosFiado = typeof getPagamentosFiadoHoje === 'function' ? getPagamentosFiadoHoje() : 0;
    const totalVendido = receitaVendas + pagamentosFiado;
    const valorFinal = caixa.valorInicial + totalVendido + entradas - retiradas;

    document.getElementById('resumoValorInicial').textContent = formatarMoeda(caixa.valorInicial);
    document.getElementById('resumoTotalVendido').textContent = formatarMoeda(totalVendido);
    document.getElementById('resumoEntradas').textContent = formatarMoeda(entradas);
    document.getElementById('resumoRetiradas').textContent = formatarMoeda(retiradas);
    document.getElementById('resumoValorFinal').textContent = formatarMoeda(valorFinal);
    document.getElementById('pagDinheiro').textContent = formatarMoeda(totais.dinheiro);
    document.getElementById('pagDebito').textContent = formatarMoeda(totais.debito);
    document.getElementById('pagCredito').textContent = formatarMoeda(totais.credito);
    document.getElementById('pagPix').textContent = formatarMoeda(totais.pix);
    document.getElementById('pagFiado').textContent = formatarMoeda(totais.fiado);
}

function atualizarTabelaMovimentacoes(movimentacoes) {
    const tbody = document.querySelector('#tabelaMovimentacoes tbody');
    if (!tbody) return;

    tbody.innerHTML = movimentacoes.map(m => {
        const hora = new Date(m.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `
            <tr>
                <td>${hora}</td>
                <td><span class="badge ${m.tipo === 'entrada' ? 'success' : 'danger'}">${m.tipo === 'entrada' ? 'Entrada' : 'Retirada'}</span></td>
                <td class="${m.tipo === 'entrada' ? 'text-success' : 'text-danger'}">${formatarMoeda(m.valor)}</td>
                <td>${m.descricao}</td>
            </tr>
        `;
    }).join('');
}

function mostrarRelatorioFechamento(relatorio) {
    alert(`RELATÓRIO DE FECHAMENTO\n\nValor Inicial: ${formatarMoeda(relatorio.valorInicial)}\nTotal Vendido: ${formatarMoeda(relatorio.totalVendido)}\nEntradas: ${formatarMoeda(relatorio.entradas)}\nRetiradas: ${formatarMoeda(relatorio.retiradas)}\n\nVALOR FINAL: ${formatarMoeda(relatorio.valorFinal)}\nQuantidade de Vendas: ${relatorio.quantidadeVendas}`);
}

// ============================================
// SISTEMA DE FIADO
// ============================================

function inicializarFiado() {
    document.getElementById('btnCadastrarCliente').addEventListener('click', () => abrirModal('modalCliente'));

    document.getElementById('btnSalvarCliente').addEventListener('click', () => {
        const nome = document.getElementById('nomeCliente').value.trim();
        const telefone = document.getElementById('telefoneCliente').value.trim();
        const notas = document.getElementById('notasCliente').value.trim();
        if (!nome) { mostrarToast('Digite o nome do cliente!', 'error'); return; }
        adicionarCliente({ nome, telefone, notas: notas || undefined });
        mostrarToast('Cliente cadastrado com sucesso!', 'success');
        document.getElementById('nomeCliente').value = '';
        document.getElementById('telefoneCliente').value = '';
        document.getElementById('notasCliente').value = '';
        fecharModal('modalCliente');
        atualizarTelaFiado();
    });

    document.getElementById('btnCancelarCliente').addEventListener('click', () => fecharModal('modalCliente'));
    document.getElementById('btnFecharModalCliente').addEventListener('click', () => fecharModal('modalCliente'));

    document.getElementById('btnConfirmarPagamento').addEventListener('click', () => {
        const clienteId = document.getElementById('pagamentoClienteId').value;
        const valor = parseFloat(document.getElementById('valorPagamento').value);
        const tipo = document.querySelector('input[name="tipoPagamento"]:checked').value;
        if (!valor || valor <= 0) { mostrarToast('Digite um valor válido!', 'error'); return; }
        if (registrarPagamentoCliente(clienteId, valor, tipo)) {
            mostrarToast('Pagamento registrado com sucesso!', 'success');
            fecharModal('modalPagamento');
            atualizarTelaFiado();
        } else {
            mostrarToast('Erro ao registrar pagamento!', 'error');
        }
    });

    document.getElementById('btnCancelarPagamento').addEventListener('click', () => fecharModal('modalPagamento'));
    document.getElementById('btnFecharModalPagamento').addEventListener('click', () => fecharModal('modalPagamento'));

    document.querySelectorAll('.historico-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.historico-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panelId = 'tab' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1);
            const panel = document.getElementById(panelId);
            if (panel) panel.classList.add('active');
        });
    });

    document.getElementById('btnFecharModalHistorico').addEventListener('click', () => fecharModal('modalHistorico'));

    // Busca Fiado: filtro em tempo real por nome ou telefone
    const buscaFiadoEl = document.getElementById('buscaFiado');
    if (buscaFiadoEl) {
        buscaFiadoEl.addEventListener('input', () => atualizarTelaFiado());
    }

    // Modal Editar Cliente
    document.getElementById('btnSalvarEditarCliente').addEventListener('click', () => salvarEdicaoCliente());
    document.getElementById('btnCancelarEditarCliente').addEventListener('click', () => fecharModal('modalEditarCliente'));
    document.getElementById('btnFecharModalEditarCliente').addEventListener('click', () => fecharModal('modalEditarCliente'));
}

function atualizarTelaFiado() {
    const clientes = getClientes();
    const termoBusca = (document.getElementById('buscaFiado') && document.getElementById('buscaFiado').value.trim()) || '';
    const termo = termoBusca.toLowerCase();
    const clientesFiltrados = termo
        ? clientes.filter(c => (c.nome && c.nome.toLowerCase().includes(termo)) || (c.telefone && c.telefone.includes(termo)))
        : clientes;

    document.getElementById('fiadoTotalClientes').textContent = clientes.length;
    document.getElementById('fiadoTotalValor').textContent = formatarMoeda(calcularTotalFiado());

    const tbody = document.querySelector('#tabelaClientes tbody');
    if (!tbody) return;

    function ultimaCompra(cliente) {
        const compras = cliente.historicoCompras || [];
        if (compras.length === 0) return '-';
        const ordenadas = [...compras].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
        return formatarDataHora(ordenadas[0].data) || '-';
    }

    tbody.innerHTML = clientesFiltrados.map(cliente => `
        <tr>
            <td>${cliente.nome}</td>
            <td class="${cliente.saldo > 0 ? 'text-danger' : ''}"><strong>${formatarMoeda(cliente.saldo)}</strong></td>
            <td>${ultimaCompra(cliente)}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="abrirPagamento('${cliente.id}')">
                    <i class="fas fa-money-bill-wave"></i> Pagar
                </button>
                <button class="btn btn-sm btn-info" onclick="verHistorico('${cliente.id}')">
                    <i class="fas fa-history"></i> Histórico
                </button>
                <button class="btn btn-sm btn-secondary" onclick="abrirEdicaoCliente('${cliente.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="excluirClienteFiado('${cliente.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

function abrirEdicaoCliente(clienteId) {
    const cliente = getCliente(clienteId);
    if (!cliente) return;
    document.getElementById('editarClienteId').value = cliente.id;
    document.getElementById('editarClienteNome').value = cliente.nome || '';
    document.getElementById('editarClienteTelefone').value = cliente.telefone || '';
    document.getElementById('editarClienteNotas').value = cliente.notas || '';
    abrirModal('modalEditarCliente');
}

function salvarEdicaoCliente() {
    const id = document.getElementById('editarClienteId').value;
    const nome = document.getElementById('editarClienteNome').value.trim();
    const telefone = document.getElementById('editarClienteTelefone').value.trim();
    const notas = document.getElementById('editarClienteNotas').value.trim();
    if (!nome) { mostrarToast('Digite o nome do cliente!', 'error'); return; }
    const cliente = getCliente(id);
    if (!cliente) { mostrarToast('Cliente não encontrado.', 'error'); return; }
    cliente.nome = nome;
    cliente.telefone = telefone || '';
    cliente.notas = notas || '';
    atualizarCliente(cliente);
    mostrarToast('Cliente atualizado!', 'success');
    fecharModal('modalEditarCliente');
    atualizarTelaFiado();
}

function excluirClienteFiado(clienteId) {
    const cliente = getCliente(clienteId);
    if (!cliente) return;
    if ((cliente.saldo || 0) > 0) {
        mostrarToast('Não é possível excluir um cliente com dívida em aberto.', 'error');
        return;
    }
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    if (excluirCliente(clienteId)) {
        mostrarToast('Cliente excluído.', 'success');
        atualizarTelaFiado();
    } else {
        mostrarToast('Não foi possível excluir o cliente.', 'error');
    }
}

function abrirPagamento(clienteId) {
    const cliente = getCliente(clienteId);
    if (!cliente) return;
    document.getElementById('pagamentoClienteId').value = clienteId;
    document.getElementById('pagamentoClienteNome').textContent = cliente.nome;
    document.getElementById('pagamentoSaldoAtual').textContent = formatarMoeda(cliente.saldo);
    document.getElementById('valorPagamento').value = '';
    abrirModal('modalPagamento');
}

function verHistorico(clienteId) {
    const cliente = getCliente(clienteId);
    if (!cliente) return;
    document.getElementById('historicoClienteNome').textContent = cliente.nome;

    const tbodyCompras = document.querySelector('#tabelaHistoricoCompras tbody');
    tbodyCompras.innerHTML = cliente.historicoCompras.map(c => `
        <tr>
            <td>${formatarDataHora(c.data)}</td>
            <td>${formatarMoeda(c.valor)}</td>
            <td>Compra fiado</td>
        </tr>
    `).join('');

    const tbodyPag = document.querySelector('#tabelaHistoricoPagamentos tbody');
    tbodyPag.innerHTML = cliente.historicoPagamentos.map(p => `
        <tr>
            <td>${formatarDataHora(p.data)}</td>
            <td>${formatarMoeda(p.valor)}</td>
            <td>${p.tipo === 'total' ? 'Quitação Total' : 'Quitação Parcial'}</td>
        </tr>
    `).join('');

    abrirModal('modalHistorico');
}

// ============================================
// ESTOQUE DE CIGARROS
// ============================================

function inicializarEstoque() {
    document.getElementById('btnCadastrarProduto').addEventListener('click', () => abrirModal('modalProduto'));

    document.getElementById('btnSalvarProduto').addEventListener('click', () => {
        const marca = document.getElementById('marcaProduto').value.trim();
        const tipo = document.getElementById('tipoProduto').value.trim();
        const quantidade = parseInt(document.getElementById('quantidadeProduto').value) || 0;
        const estoqueMinimo = parseInt(document.getElementById('estoqueMinimoProduto')?.value) || 10;
        const valorVenda = parseFloat(document.getElementById('valorVendaProduto').value) || 0;
        const valorVendaPacote = parseFloat(document.getElementById('valorVendaPacoteProduto')?.value) || 0;
        const valorCusto = parseFloat(document.getElementById('valorCustoProduto').value) || 0;

        if (!marca || !tipo) { mostrarToast('Preencha marca e tipo!', 'error'); return; }
        adicionarProduto({ marca, tipo, quantidade, estoqueMinimo, valorVenda, valorVendaPacote, valorCusto });
        mostrarToast('Produto cadastrado com sucesso!', 'success');

        ['marcaProduto', 'tipoProduto', 'quantidadeProduto', 'estoqueMinimoProduto', 'valorVendaProduto', 'valorVendaPacoteProduto', 'valorCustoProduto']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = id === 'estoqueMinimoProduto' ? '10' : ''; });

        fecharModal('modalProduto');
        atualizarTelaEstoque();
    });

    document.getElementById('btnCancelarProduto').addEventListener('click', () => fecharModal('modalProduto'));
    document.getElementById('btnFecharModalProduto').addEventListener('click', () => fecharModal('modalProduto'));

    document.getElementById('btnAtualizarProduto').addEventListener('click', () => {
        const id = parseInt(document.getElementById('editarProdutoId').value);
        const produto = getProduto(id);
        if (!produto) return;

        produto.quantidadeMacos = parseInt(document.getElementById('editarMacos').value) || 0;
        produto.quantidadeCarteiras = parseInt(document.getElementById('editarCarteiras').value) || 0;
        produto.quantidade = (parseInt(document.getElementById('editarQuantidade').value) || 0) +
            (parseInt(document.getElementById('editarAdicionar').value) || 0);
        const editarEstoqueMin = document.getElementById('editarEstoqueMinimo');
        produto.estoqueMinimo = editarEstoqueMin && editarEstoqueMin.value !== '' ? parseInt(editarEstoqueMin.value) || 10 : 10;
        produto.valorVenda = parseFloat(document.getElementById('editarValorVenda').value) || 0;
        const editarVendaPacote = document.getElementById('editarValorVendaPacote');
        produto.valorVendaPacote = editarVendaPacote ? parseFloat(editarVendaPacote.value) || 0 : 0;
        produto.valorVendaCarteira = produto.valorVendaPacote;
        produto.valorCustoCarteira = parseFloat(document.getElementById('editarValorCusto').value) || 0;

        atualizarProduto(produto);
        mostrarToast('Produto atualizado!', 'success');
        fecharModal('modalEditarProduto');
        atualizarTelaEstoque();
    });

    document.getElementById('btnCancelarEdicao').addEventListener('click', () => fecharModal('modalEditarProduto'));
    document.getElementById('btnFecharModalEditar').addEventListener('click', () => fecharModal('modalEditarProduto'));
    ['editarAdicionar', 'editarQuantidade', 'editarMacos', 'editarCarteiras'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', atualizarPrevisaoEstoque);
    });
}

function atualizarTelaEstoque() {
    const estoque = getEstoque();
    const stats = calcularEstatisticasEstoque();
    document.getElementById('estoqueMarcas').textContent = stats.marcas;
    document.getElementById('estoqueUnidades').textContent = stats.unidades;
    document.getElementById('estoqueValor').textContent = formatarMoeda(stats.valor);

    const tbody = document.querySelector('#tabelaEstoque tbody');
    if (!tbody) return;

    tbody.innerHTML = estoque.map(produto => {
        const totalUn = typeof getTotalUnidadesCigarro === 'function' ? getTotalUnidadesCigarro(produto) : (produto.quantidade || 0);
        const custoPorCart = produto.valorCustoCarteira != null ? produto.valorCustoCarteira : (produto.valorCusto || 0);
        const lucroPorCart = (produto.valorVendaCarteira || produto.valorVenda || 0) - custoPorCart;
        const previsao = calcularPrevisaoEstoque(produto, 1);
        const minEst = produto.estoqueMinimo != null && produto.estoqueMinimo !== '' ? produto.estoqueMinimo : 10;
        const estoqueBaixo = totalUn > 0 && totalUn <= minEst;

        return `
            <tr class="${estoqueBaixo ? 'estoque-baixo' : ''}">
                <td>${produto.marca}</td>
                <td>${produto.tipo}</td>
                <td>${produto.quantidadeMacos || 0}</td>
                <td>${produto.quantidadeCarteiras || 0}</td>
                <td>
                    <strong>${produto.quantidade != null ? produto.quantidade : 0}</strong>
                    ${estoqueBaixo ? '<span class="badge danger" style="margin-left:4px;font-size:0.65rem;">Baixo</span>' : ''}
                </td>
                <td>${minEst}</td>
                <td>${formatarMoeda(produto.valorVenda)}</td>
                <td>${formatarMoeda(custoPorCart)}</td>
                <td class="${lucroPorCart > 0 ? 'text-success' : ''}">${formatarMoeda(lucroPorCart)}</td>
                <td>${previsao === Infinity ? '∞' : previsao + ' dias'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editarProduto(${produto.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmarExcluirProduto(${produto.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function editarProduto(id) {
    const produto = getProduto(id);
    if (!produto) return;
    document.getElementById('editarProdutoId').value = id;
    document.getElementById('editarProdutoNome').textContent = `${produto.marca} ${produto.tipo}`;
    const editarMacos = document.getElementById('editarMacos');
    if (editarMacos) editarMacos.value = produto.quantidadeMacos != null ? produto.quantidadeMacos : 0;
    const editarCarteiras = document.getElementById('editarCarteiras');
    if (editarCarteiras) editarCarteiras.value = produto.quantidadeCarteiras != null ? produto.quantidadeCarteiras : 0;
    document.getElementById('editarQuantidade').value = produto.quantidade != null ? produto.quantidade : 0;
    document.getElementById('editarAdicionar').value = '';
    const editarEstoqueMin = document.getElementById('editarEstoqueMinimo');
    if (editarEstoqueMin) editarEstoqueMin.value = produto.estoqueMinimo != null ? produto.estoqueMinimo : 10;
    document.getElementById('editarValorVenda').value = produto.valorVenda;
    const editarVendaPacote = document.getElementById('editarValorVendaPacote');
    if (editarVendaPacote) editarVendaPacote.value = (produto.valorVendaCarteira != null ? produto.valorVendaCarteira : produto.valorVendaPacote) || 0;
    document.getElementById('editarValorCusto').value = (produto.valorCustoCarteira != null ? produto.valorCustoCarteira : produto.valorCusto) || 0;
    atualizarPrevisaoEstoque();
    abrirModal('modalEditarProduto');
}

function atualizarPrevisaoEstoque() {
    const id = parseInt(document.getElementById('editarProdutoId').value);
    const produto = getProduto(id);
    if (!produto) return;

    const macos = (parseInt(document.getElementById('editarMacos').value) || 0);
    const carteiras = (parseInt(document.getElementById('editarCarteiras').value) || 0);
    const un = (parseInt(document.getElementById('editarQuantidade').value) || 0) + (parseInt(document.getElementById('editarAdicionar').value) || 0);
    const total = macos * 200 + carteiras * 20 + un;

    const textoPrevisao = document.getElementById('textoPrevisao');
    if (total === 0) {
        textoPrevisao.textContent = 'Estoque zerado. Necessário repor urgentemente.';
        textoPrevisao.className = 'text-danger';
    } else if (total < 10) {
        textoPrevisao.textContent = `${total} unidades — estoque baixo. Considere repor em breve.`;
        textoPrevisao.className = 'text-warning';
    } else {
        textoPrevisao.textContent = `${total} unidades — estoque adequado (~${Math.floor(total)} dias estimados).`;
        textoPrevisao.className = 'text-success';
    }
}

function confirmarExcluirProduto(id) {
    const p = getProduto(id);
    if (!p) return;
    if (confirm(`Excluir "${p.marca} ${p.tipo}" permanentemente?`)) {
        excluirProduto(id);
        mostrarToast('Produto excluído!', 'success');
        atualizarTelaEstoque();
        atualizarDashboard();
    }
}

// ============================================
// ESTOQUE DE BEBIDAS (UNIDADE E CAIXA)
// ============================================

function inicializarBebidas() {
    const btnCadastrar = document.getElementById('btnCadastrarBebida');
    if (btnCadastrar) {
        btnCadastrar.addEventListener('click', () => abrirModal('modalBebida'));
    }

    const btnSalvar = document.getElementById('btnSalvarBebida');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            const nome = document.getElementById('nomeBebida').value.trim();
            const categoria = document.getElementById('categoriaBebida').value.trim();
            const unidadesPorCaixa = parseInt(document.getElementById('unidadesPorCaixa').value) || 12;
            const quantidadeUnidades = parseInt(document.getElementById('quantidadeUnidadesBebida').value) || 0;
            const quantidadeCaixas = parseInt(document.getElementById('quantidadeCaixasBebida').value) || 0;
            const valorVendaUnidade = parseFloat(document.getElementById('valorVendaUnidadeBebida').value) || 0;
            const valorVendaCaixa = parseFloat(document.getElementById('valorVendaCaixaBebida').value) || 0;
            const valorCustoUnidade = parseFloat(document.getElementById('valorCustoUnidadeBebida').value) || 0;
            const valorCustoCaixa = parseFloat(document.getElementById('valorCustoCaixaBebida').value) || 0;

            if (!nome) { mostrarToast('Digite o nome da bebida!', 'error'); return; }

            adicionarBebida({ nome, categoria, unidadesPorCaixa, quantidadeUnidades, quantidadeCaixas,
                valorVendaUnidade, valorVendaCaixa, valorCustoUnidade, valorCustoCaixa });
            mostrarToast('Bebida cadastrada com sucesso!', 'success');
            fecharModal('modalBebida');
            atualizarTelaBebidas();
        });
    }

    const btnCancelar = document.getElementById('btnCancelarBebida');
    if (btnCancelar) btnCancelar.addEventListener('click', () => fecharModal('modalBebida'));
    const btnFechar = document.getElementById('btnFecharModalBebida');
    if (btnFechar) btnFechar.addEventListener('click', () => fecharModal('modalBebida'));

    // Editar bebida
    const btnAtualizar = document.getElementById('btnAtualizarBebida');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', () => {
            const id = parseInt(document.getElementById('editarBebidaId').value);
            const bebida = getBebida(id);
            if (!bebida) return;

            bebida.quantidadeUnidades = (parseInt(document.getElementById('editarUnidadesBebida').value) || 0) +
                (parseInt(document.getElementById('editarAdicionarUnidades').value) || 0);
            bebida.quantidadeCaixas = (parseInt(document.getElementById('editarCaixasBebida').value) || 0) +
                (parseInt(document.getElementById('editarAdicionarCaixas').value) || 0);
            bebida.valorVendaUnidade = parseFloat(document.getElementById('editarVendaUnidade').value) || 0;
            bebida.valorVendaCaixa = parseFloat(document.getElementById('editarVendaCaixa').value) || 0;
            bebida.valorCustoUnidade = parseFloat(document.getElementById('editarCustoUnidade').value) || 0;
            bebida.valorCustoCaixa = parseFloat(document.getElementById('editarCustoCaixa').value) || 0;

            atualizarBebida(bebida);
            mostrarToast('Bebida atualizada!', 'success');
            fecharModal('modalEditarBebida');
            atualizarTelaBebidas();
        });
    }

    const btnCancelarEdicao = document.getElementById('btnCancelarEdicaoBebida');
    if (btnCancelarEdicao) btnCancelarEdicao.addEventListener('click', () => fecharModal('modalEditarBebida'));
    const btnFecharEdicao = document.getElementById('btnFecharModalEditarBebida');
    if (btnFecharEdicao) btnFecharEdicao.addEventListener('click', () => fecharModal('modalEditarBebida'));
}

function atualizarTelaBebidas() {
    const bebidas = getBebidas();
    const stats = calcularEstatisticasBebidas();

    const totalEl = document.getElementById('bebidasTotal');
    if (totalEl) totalEl.textContent = stats.total;
    const unidadesEl = document.getElementById('bebidasUnidades');
    if (unidadesEl) unidadesEl.textContent = stats.unidades;
    const valorEl = document.getElementById('bebidasValor');
    if (valorEl) valorEl.textContent = formatarMoeda(stats.valor);

    const tbody = document.querySelector('#tabelaBebidas tbody');
    if (!tbody) return;

    tbody.innerHTML = bebidas.map(b => {
        const totalUnidades = (b.quantidadeUnidades || 0) + (b.quantidadeCaixas || 0) * (b.unidadesPorCaixa || 24);
        const estoqueBaixo = totalUnidades > 0 && totalUnidades <= (b.estoqueMinimo || 12);
        const lucroUnidade = (b.valorVendaUnidade || 0) - (b.valorCustoUnidade || 0);

        return `
            <tr class="${estoqueBaixo ? 'estoque-baixo' : ''}">
                <td>${b.nome}</td>
                <td>${b.categoria || '-'}</td>
                <td>${b.unidadesPorCaixa || 24}</td>
                <td>${b.quantidadeCaixas || 0} cx + ${b.quantidadeUnidades || 0} un
                    ${estoqueBaixo ? '<span class="badge danger" style="margin-left:4px;font-size:0.65rem;">Baixo</span>' : ''}
                </td>
                <td>${formatarMoeda(b.valorVendaUnidade)} / ${formatarMoeda(b.valorVendaCaixa)}</td>
                <td class="${lucroUnidade > 0 ? 'text-success' : ''}">${formatarMoeda(lucroUnidade)}/un</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editarBebida(${b.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmarExcluirBebida(${b.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function editarBebida(id) {
    const bebida = getBebida(id);
    if (!bebida) return;

    document.getElementById('editarBebidaId').value = id;
    document.getElementById('editarBebidaNome').textContent = bebida.nome;
    document.getElementById('editarUnidadesBebida').value = bebida.quantidadeUnidades || 0;
    document.getElementById('editarCaixasBebida').value = bebida.quantidadeCaixas || 0;
    document.getElementById('editarAdicionarUnidades').value = '';
    document.getElementById('editarAdicionarCaixas').value = '';
    document.getElementById('editarVendaUnidade').value = bebida.valorVendaUnidade || 0;
    document.getElementById('editarVendaCaixa').value = bebida.valorVendaCaixa || 0;
    document.getElementById('editarCustoUnidade').value = bebida.valorCustoUnidade || 0;
    document.getElementById('editarCustoCaixa').value = bebida.valorCustoCaixa || 0;

    abrirModal('modalEditarBebida');
}

function confirmarExcluirBebida(id) {
    const b = getBebida(id);
    if (!b) return;
    if (confirm(`Excluir "${b.nome}" permanentemente?`)) {
        excluirBebida(id);
        mostrarToast('Bebida excluída!', 'success');
        atualizarTelaBebidas();
        atualizarDashboard();
    }
}

// ============================================
// MERCEARIA
// ============================================

function inicializarMercearia() {
    const btnCadastrar = document.getElementById('btnCadastrarMercearia');
    if (btnCadastrar) btnCadastrar.addEventListener('click', () => abrirModal('modalMercearia'));

    const btnSalvar = document.getElementById('btnSalvarMercearia');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            const nome = document.getElementById('nomeMercearia').value.trim();
            const categoria = document.getElementById('categoriaMercearia').value.trim();
            const quantidade = parseInt(document.getElementById('quantidadeMercearia').value) || 0;
            const valorVenda = parseFloat(document.getElementById('valorVendaMercearia').value) || 0;
            const valorCusto = parseFloat(document.getElementById('valorCustoMercearia').value) || 0;
            const estoqueMinimo = parseInt(document.getElementById('estoqueMinMercearia').value) || 5;

            if (!nome) { mostrarToast('Digite o nome do produto!', 'error'); return; }

            adicionarItemMercearia({ nome, categoria, quantidade, valorVenda, valorCusto, estoqueMinimo });
            mostrarToast('Produto cadastrado com sucesso!', 'success');
            ['nomeMercearia','categoriaMercearia','quantidadeMercearia','valorVendaMercearia','valorCustoMercearia','estoqueMinMercearia']
                .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            fecharModal('modalMercearia');
            atualizarTelaMercearia();
        });
    }

    const btnCancelar = document.getElementById('btnCancelarMercearia');
    if (btnCancelar) btnCancelar.addEventListener('click', () => fecharModal('modalMercearia'));
    const btnFechar = document.getElementById('btnFecharModalMercearia');
    if (btnFechar) btnFechar.addEventListener('click', () => fecharModal('modalMercearia'));

    // Editar
    const btnAtualizar = document.getElementById('btnAtualizarMercearia');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', () => {
            const id = parseInt(document.getElementById('editarMerceariaId').value);
            const item = getItemMercearia(id);
            if (!item) return;

            item.quantidade = (parseInt(document.getElementById('editarQtdMercearia').value) || 0) +
                (parseInt(document.getElementById('editarAddMercearia').value) || 0);
            item.valorVenda = parseFloat(document.getElementById('editarVendaMercearia').value) || 0;
            item.valorCusto = parseFloat(document.getElementById('editarCustoMerceariaEdit').value) || 0;
            item.estoqueMinimo = parseInt(document.getElementById('editarMinMercearia').value) || 5;

            atualizarItemMercearia(item);
            mostrarToast('Produto atualizado!', 'success');
            fecharModal('modalEditarMercearia');
            atualizarTelaMercearia();
        });
    }

    const btnCancelarEd = document.getElementById('btnCancelarEdicaoMercearia');
    if (btnCancelarEd) btnCancelarEd.addEventListener('click', () => fecharModal('modalEditarMercearia'));
    const btnFecharEd = document.getElementById('btnFecharModalEditarMercearia');
    if (btnFecharEd) btnFecharEd.addEventListener('click', () => fecharModal('modalEditarMercearia'));
}

function atualizarTelaMercearia() {
    const lista = getMercearia();
    const stats = calcularEstatisticasMercearia();

    const totalEl = document.getElementById('merceariaTotal');
    if (totalEl) totalEl.textContent = stats.total;
    const unidadesEl = document.getElementById('merceariaUnidades');
    if (unidadesEl) unidadesEl.textContent = stats.unidades;
    const valorEl = document.getElementById('merceariaValor');
    if (valorEl) valorEl.textContent = formatarMoeda(stats.valor);

    const tbody = document.querySelector('#tabelaMercearia tbody');
    if (!tbody) return;

    tbody.innerHTML = lista.map(item => {
        const lucro = (item.valorVenda || 0) - (item.valorCusto || 0);
        const baixo = (item.quantidade || 0) > 0 && (item.quantidade || 0) <= (item.estoqueMinimo || 5);
        return `
            <tr class="${baixo ? 'estoque-baixo' : ''}">
                <td>${item.nome}</td>
                <td><span class="badge secondary">${item.categoria || 'geral'}</span></td>
                <td>
                    <strong>${item.quantidade || 0}</strong>
                    ${baixo ? '<span class="badge danger" style="margin-left:4px;font-size:0.65rem;">Baixo</span>' : ''}
                </td>
                <td>${formatarMoeda(item.valorVenda)}</td>
                <td>${formatarMoeda(item.valorCusto)}</td>
                <td class="${lucro > 0 ? 'text-success' : ''}">${formatarMoeda(lucro)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editarMercearia(${item.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmarExcluirMercearia(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function editarMercearia(id) {
    const item = getItemMercearia(id);
    if (!item) return;
    document.getElementById('editarMerceariaId').value = id;
    document.getElementById('editarMerceariaNome').textContent = item.nome;
    document.getElementById('editarQtdMercearia').value = item.quantidade || 0;
    document.getElementById('editarAddMercearia').value = '';
    document.getElementById('editarVendaMercearia').value = item.valorVenda || 0;
    document.getElementById('editarCustoMerceariaEdit').value = item.valorCusto || 0;
    document.getElementById('editarMinMercearia').value = item.estoqueMinimo || 5;
    abrirModal('modalEditarMercearia');
}

function confirmarExcluirMercearia(id) {
    const item = getItemMercearia(id);
    if (!item) return;
    if (confirm(`Excluir "${item.nome}" permanentemente?`)) {
        excluirItemMercearia(id);
        mostrarToast('Produto excluído!', 'success');
        atualizarTelaMercearia();
        atualizarDashboard();
    }
}

// ============================================
// FORNECEDORES
// ============================================

/**
 * Detecta automaticamente a categoria do produto pelo nome
 * Cigarros: marcas conhecidas
 * Bebidas: cerveja, refrigerante, água, suco, vinho, etc.
 * Mercearia: tudo o mais
 */
function detectarCategoriaFornecedor(nomeProduto) {
    const nome = nomeProduto.toLowerCase();

    const palavrasCigarro = [
        'kent','rothmans','lucky strike','dunhill','ws ','gift','camel','winston',
        'marlboro','derby','dallas','hollywood','free','cigarro','cigarros','carteira'
    ];
    const palavrasBebida = [
        'cerveja','brahma','skol','heineken','itaipava','crystal','antartica','budweiser',
        'corona','stella','spaten','original','bohemia','eisenbahn','devassa',
        'refrigerante','coca','pepsi','guaraná','fanta','sprite','schweppes',
        'água','suco','vinho','vodka','whisky','cachaça','rum','gin','energético',
        'red bull','monster','ice','gelada','lata','garrafa','long neck','chopp'
    ];

    for (const p of palavrasCigarro) {
        if (nome.includes(p)) return 'cigarro';
    }
    for (const p of palavrasBebida) {
        if (nome.includes(p)) return 'bebida';
    }
    return 'mercearia';
}

// Itens da compra em memória (para modal Nova Compra)
let compraItensTemp = [];

function inicializarFornecedores() {
    document.getElementById('btnCadastrarFornecedor').addEventListener('click', () => abrirModal('modalFornecedor'));

    const btnCadastro = document.getElementById('btnCadastroFornecedor');
    if (btnCadastro) btnCadastro.addEventListener('click', () => {
        document.getElementById('supplierNome').value = '';
        document.getElementById('supplierContato').value = '';
        document.getElementById('supplierNotas').value = '';
        abrirModal('modalCadastroFornecedor');
    });
    const btnSalvarCadastro = document.getElementById('btnSalvarCadastroFornecedor');
    if (btnSalvarCadastro) btnSalvarCadastro.addEventListener('click', () => {
        const nome = document.getElementById('supplierNome').value.trim();
        if (!nome) { mostrarToast('Digite o nome do fornecedor!', 'error'); return; }
        addSupplier({ nome, contato: document.getElementById('supplierContato').value.trim(), notas: document.getElementById('supplierNotas').value.trim() });
        mostrarToast('Fornecedor cadastrado!', 'success');
        fecharModal('modalCadastroFornecedor');
        atualizarCarteiraFornecedores();
    });
    document.getElementById('btnFecharCadastroFornecedor')?.addEventListener('click', () => fecharModal('modalCadastroFornecedor'));
    document.getElementById('btnCancelarCadastroFornecedor')?.addEventListener('click', () => fecharModal('modalCadastroFornecedor'));

    const btnNovaCompra = document.getElementById('btnNovaCompra');
    if (btnNovaCompra) btnNovaCompra.addEventListener('click', () => {
        const sel = document.getElementById('compraFornecedorId');
        sel.innerHTML = '<option value="">Selecione...</option>' + getSuppliers().map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
        compraItensTemp = [];
        renderizarItensCompra();
        abrirModal('modalNovaCompra');
    });
    document.getElementById('btnAdicionarItemCompra')?.addEventListener('click', () => {
        compraItensTemp.push({ tipo: 'mercearia', produtoId: '', quantidade: 0, custoUnitario: 0 });
        renderizarItensCompra();
    });
    document.getElementById('btnSalvarCompra')?.addEventListener('click', () => {
        const fornecedorId = document.getElementById('compraFornecedorId').value;
        if (!fornecedorId) { mostrarToast('Selecione um fornecedor!', 'error'); return; }
        const div = document.getElementById('compraItensLista');
        const rows = div ? div.querySelectorAll('.compra-item-row') : [];
        const itens = [];
        rows.forEach(row => {
            const tipo = (row.querySelector('.compra-item-tipo')?.value || 'mercearia').toLowerCase();
            const produtoId = (row.querySelector('.compra-item-produto')?.value || '').trim();
            const quantidade = parseInt(row.querySelector('.compra-item-qtd')?.value) || 0;
            const custoUnitario = parseFloat(row.querySelector('.compra-item-custo')?.value) || 0;
            if (produtoId && quantidade > 0) itens.push({ tipo, produtoId, quantidade, custoUnitario });
        });
        if (!itens.length) { mostrarToast('Adicione pelo menos um item: selecione produto e quantidade!', 'error'); return; }
        addCompra({ fornecedorId, itens });
        mostrarToast('Compra registrada e estoque atualizado!', 'success');
        fecharModal('modalNovaCompra');
        atualizarCarteiraFornecedores();
        atualizarTelaEstoque();
        atualizarTelaBebidas();
        atualizarTelaMercearia();
        atualizarDashboard();
    });
    document.getElementById('btnFecharNovaCompra')?.addEventListener('click', () => fecharModal('modalNovaCompra'));
    document.getElementById('btnCancelarNovaCompra')?.addEventListener('click', () => fecharModal('modalNovaCompra'));

    function renderizarItensCompra() {
        const div = document.getElementById('compraItensLista');
        if (!div) return;
        const listas = typeof getProdutosParaCompra === 'function' ? getProdutosParaCompra() : { cigarro: [], bebida: [], mercearia: [] };
        div.innerHTML = compraItensTemp.map((item, idx) => {
            const tipo = item.tipo || 'mercearia';
            const produtos = listas[tipo] || [];
            const options = produtos.map(p => {
                const id = p.id;
                const label = tipo === 'cigarro' ? `${(p.marca || '')} ${(p.tipo || '')}` : (tipo === 'bebida' ? (p.nome || p.marca || 'Bebida') : (p.nome || 'Item'));
                return `<option value="${id}" ${item.produtoId === String(id) ? 'selected' : ''}>${label}</option>`;
            }).join('');
            const labelQtd = tipo === 'cigarro' ? 'Maços' : tipo === 'bebida' ? 'Caixas' : 'Qtd';
            const labelCusto = tipo === 'cigarro' ? 'Custo/maço' : tipo === 'bebida' ? 'Custo/un' : 'Custo/un';
            return `
            <div class="form-row compra-item-row" style="margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                <select class="compra-item-tipo" data-idx="${idx}" style="width:100px;">
                    <option value="cigarro" ${tipo==='cigarro'?'selected':''}>Cigarro</option>
                    <option value="bebida" ${tipo==='bebida'?'selected':''}>Bebida</option>
                    <option value="mercearia" ${tipo==='mercearia'?'selected':''}>Mercearia</option>
                </select>
                <select class="compra-item-produto" data-idx="${idx}" style="min-width:140px;flex:1;">
                    <option value="">Selecione o produto</option>
                    ${options}
                </select>
                <input type="number" class="compra-item-qtd" data-idx="${idx}" placeholder="${labelQtd}" value="${item.quantidade||''}" min="1" style="width:80px;">
                <input type="number" class="compra-item-custo" data-idx="${idx}" placeholder="${labelCusto}" step="0.01" value="${item.custoUnitario||''}" style="width:95px;">
                <button type="button" class="btn btn-sm btn-danger" data-idx="${idx}" aria-label="Remover"><i class="fas fa-trash"></i></button>
            </div>`;
        }).join('');
        div.querySelectorAll('.compra-item-tipo').forEach(el => {
            const i = parseInt(el.dataset.idx);
            el.addEventListener('change', () => { compraItensTemp[i].tipo = el.value; compraItensTemp[i].produtoId = ''; renderizarItensCompra(); });
        });
        div.querySelectorAll('.compra-item-produto').forEach(el => {
            const i = parseInt(el.dataset.idx);
            el.addEventListener('change', () => { compraItensTemp[i].produtoId = el.value; });
        });
        div.querySelectorAll('.compra-item-qtd').forEach(el => {
            const i = parseInt(el.dataset.idx);
            el.addEventListener('input', () => { compraItensTemp[i].quantidade = el.value; });
            el.addEventListener('change', () => { compraItensTemp[i].quantidade = el.value; });
        });
        div.querySelectorAll('.compra-item-custo').forEach(el => {
            const i = parseInt(el.dataset.idx);
            el.addEventListener('input', () => { compraItensTemp[i].custoUnitario = el.value; });
            el.addEventListener('change', () => { compraItensTemp[i].custoUnitario = el.value; });
        });
        div.querySelectorAll('.btn-danger[data-idx]').forEach(btn => {
            btn.addEventListener('click', () => { const i = parseInt(btn.dataset.idx); compraItensTemp.splice(i, 1); renderizarItensCompra(); });
        });
    }

    function atualizarCarteiraFornecedores() {
        const div = document.getElementById('carteiraFornecedores');
        if (!div) return;
        const suppliers = getSuppliers();
        if (!suppliers.length) { div.innerHTML = '<p style="color:#888;">Nenhum fornecedor cadastrado. Use "Cadastrar Fornecedor" para adicionar.</p>'; return; }
        div.innerHTML = suppliers.map(s => {
            const compras = getComprasPorFornecedor(s.id);
            const total = getTotalComprasFornecedor(s.id);
            const linhasItens = compras.flatMap(c => {
                return (c.itens || []).map(item => {
                    const tipo = (item.tipo || 'mercearia').toLowerCase();
                    let nomeProd = item.nomeProduto || '';
                    if (!nomeProd && item.produtoId) {
                        if (tipo === 'cigarro') {
                            const p = getProduto(Number(item.produtoId));
                            if (p) nomeProd = `${p.marca} ${p.tipo}`;
                        } else if (tipo === 'bebida') {
                            const b = getBebida(Number(item.produtoId));
                            if (b) nomeProd = b.nome;
                        } else {
                            const m = getItemMercearia(Number(item.produtoId));
                            if (m) nomeProd = m.nome;
                        }
                    }
                    const qtd = item.quantidade || 0;
                    const custo = item.custoUnitario || 0;
                    const isCigarro = tipo === 'cigarro';
                    const unidadeLabel = isCigarro ? 'maços' : 'un';
                    const precoLabel = isCigarro ? 'R$ / maço' : 'R$ / un';
                    const totalLinha = qtd * custo;
                    return `
                        <tr>
                            <td>${formatarData(c.data)}</td>
                            <td>${nomeProd || '-'}</td>
                            <td>${qtd} ${unidadeLabel}</td>
                            <td>${custo > 0 ? formatarMoeda(custo) : '-'}</td>
                            <td>${totalLinha > 0 ? formatarMoeda(totalLinha) : '-'}</td>
                        </tr>
                    `;
                });
            }).join('');
            return `
            <div class="carteira-fornecedor" style="margin-bottom:20px;padding:15px;background:#1a1a1a;border-radius:8px;">
                <h4 style="color:#FFD700;margin-bottom:10px;">${s.nome}</h4>
                <p style="color:#999;font-size:0.85rem;">${s.contato || '-'} ${s.notas ? ' | ' + s.notas : ''}</p>
                <p><strong>Total comprado:</strong> ${formatarMoeda(total)}</p>
                <table class="data-table" style="margin-top:10px;">
                    <thead><tr><th>Data</th><th>Total</th><th>Pago</th><th>Ação</th></tr></thead>
                    <tbody>
                        ${compras.length ? compras.map(c => `
                            <tr>
                                <td>${formatarData(c.data)}</td>
                                <td>${formatarMoeda(c.total)}</td>
                                <td>${c.pago ? '<span class="badge success">Pago</span>' : '<span class="badge danger">Não pago</span>'}</td>
                                <td><button type="button" class="btn btn-sm ${c.pago ? 'btn-secondary' : 'btn-success'}" onclick="marcarCompraPaga('${c.id}', ${!c.pago}); atualizarCarteiraFornecedores(); atualizarTabelaHistorico();">${c.pago ? 'Marcar não pago' : 'Marcar pago'}</button></td>
                            </tr>
                        `).join('') : '<tr><td colspan="4">Nenhuma compra</td></tr>'}
                    </tbody>
                </table>
                ${linhasItens ? `
                <h5 style="margin-top:10px;font-size:0.85rem;color:#ccc;">Itens comprados</h5>
                <table class="data-table" style="margin-top:6px;">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Produto</th>
                            <th>Qtd (maços/un)</th>
                            <th>Preço unitário</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasItens}
                    </tbody>
                </table>` : ''}
            </div>`;
        }).join('');
    }
    window.atualizarCarteiraFornecedores = atualizarCarteiraFornecedores;
    window.renderizarItensCompra = renderizarItensCompra;

    // Preview de margem em tempo real
    function atualizarPrevia() {
        const custo = parseFloat(document.getElementById('valorUnitarioFornecedor').value) || 0;
        const venda = parseFloat(document.getElementById('valorVendaFornecedor').value) || 0;
        const prev = document.getElementById('previaMargem');
        if (!prev) return;
        if (custo > 0 && venda > 0) {
            const lucro = venda - custo;
            const pct = ((lucro / custo) * 100).toFixed(1);
            const cor = lucro > 0 ? '#4caf50' : '#e53935';
            prev.style.display = 'block';
            prev.innerHTML = `Lucro por unidade: <strong style="color:${cor};">${formatarMoeda(lucro)}</strong> &nbsp;|&nbsp; Margem: <strong style="color:${cor};">${pct}%</strong>`;
        } else {
            prev.style.display = 'none';
        }
    }
    const custoEl = document.getElementById('valorUnitarioFornecedor');
    const vendaEl = document.getElementById('valorVendaFornecedor');
    if (custoEl) custoEl.addEventListener('input', atualizarPrevia);
    if (vendaEl) vendaEl.addEventListener('input', atualizarPrevia);

    document.getElementById('btnSalvarFornecedor').addEventListener('click', () => {
        const nome = document.getElementById('nomeFornecedor').value.trim();
        const tipoProduto = document.getElementById('tipoProdutoFornecedor').value.trim();
        const nomeProduto = document.getElementById('nomeProdutoFornecedor').value.trim();
        const quantidade = parseInt(document.getElementById('quantidadeFornecedor').value) || 0;
        const valorUnitario = parseFloat(document.getElementById('valorUnitarioFornecedor').value) || 0;
        const valorVendaUnit = parseFloat(document.getElementById('valorVendaFornecedor').value) || 0;

        if (!nome || !nomeProduto) { mostrarToast('Preencha nome do fornecedor e produto!', 'error'); return; }
        if (quantidade <= 0) { mostrarToast('Informe a quantidade!', 'error'); return; }

        const categoriaEstoque = detectarCategoriaFornecedor(nomeProduto);

        adicionarFornecedor({ nome, tipoProduto, nomeProduto, categoriaEstoque, quantidade, valorUnitario, valorVendaUnit });

        const labelCat = { cigarro: '🚬 Cigarros', bebida: '🍺 Bebidas', mercearia: '🏪 Mercearia' };
        mostrarToast(`✅ Estoque de ${labelCat[categoriaEstoque]} atualizado! +${quantidade} un de ${nomeProduto}`, 'success', 4000);

        ['nomeFornecedor','tipoProdutoFornecedor','nomeProdutoFornecedor','quantidadeFornecedor','valorUnitarioFornecedor','valorVendaFornecedor']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.getElementById('previaMargem').style.display = 'none';
        fecharModal('modalFornecedor');
        atualizarTabelaFornecedores();
        atualizarTelaEstoque();
        atualizarTelaBebidas();
        atualizarTelaMercearia();
        atualizarDashboard();
    });

    document.getElementById('btnCancelarFornecedor').addEventListener('click', () => fecharModal('modalFornecedor'));
    document.getElementById('btnFecharModalFornecedor').addEventListener('click', () => fecharModal('modalFornecedor'));

    // Modal editar fornecedor
    const btnSalvarEdicao = document.getElementById('btnSalvarEdicaoFornecedor');
    if (btnSalvarEdicao) {
        btnSalvarEdicao.addEventListener('click', () => {
            const id = document.getElementById('editarFornecedorId').value;
            const f = getFornecedor(id);
            if (!f) return;

            atualizarFornecedor({
                ...f,
                nome: document.getElementById('editarNomeFornecedor').value.trim() || f.nome,
                tipoProduto: document.getElementById('editarTipoProdutoFornecedor').value.trim(),
                nomeProduto: document.getElementById('editarNomeProdutoFornecedor').value.trim() || f.nomeProduto,
                quantidade: parseInt(document.getElementById('editarQuantidadeFornecedor').value) || 0,
                valorUnitario: parseFloat(document.getElementById('editarValorUnitarioFornecedor').value) || 0,
                valorVendaUnit: parseFloat(document.getElementById('editarValorVendaFornecedor').value) || 0
            });
            mostrarToast('Fornecedor atualizado e estoque ajustado!', 'success');
            fecharModal('modalEditarFornecedor');
            atualizarTabelaFornecedores();
            atualizarTelaEstoque();
            atualizarTelaBebidas();
            atualizarTelaMercearia();
            atualizarDashboard();
        });
    }
    const btnCancelarEd = document.getElementById('btnCancelarEdicaoFornecedor');
    if (btnCancelarEd) btnCancelarEd.addEventListener('click', () => fecharModal('modalEditarFornecedor'));
    const btnFecharEd = document.getElementById('btnFecharModalEditarFornecedor');
    if (btnFecharEd) btnFecharEd.addEventListener('click', () => fecharModal('modalEditarFornecedor'));
}

function atualizarTabelaFornecedores() {
    const tbody = document.querySelector('#tabelaFornecedores tbody');
    if (!tbody) return;
    const fornecedores = getFornecedores();

    if (fornecedores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#888;">Nenhum fornecedor cadastrado</td></tr>';
        return;
    }

    const labelCat = { cigarro: '🚬 Cigarros', bebida: '🍺 Bebidas', mercearia: '🏪 Mercearia' };

    tbody.innerHTML = fornecedores.map(f => {
        const cat = (f.categoriaEstoque || 'mercearia').toLowerCase();
        const custo = f.valorUnitario || 0;
        const venda = f.valorVendaUnit || 0;
        const lucro = venda - custo;
        const margemTxt = venda > 0 && custo > 0
            ? `<span style="color:${lucro>=0?'#4caf50':'#e53935'};">${formatarMoeda(lucro)} (${((lucro/custo)*100).toFixed(0)}%)</span>`
            : '<span style="color:#666;">—</span>';
        return `
        <tr>
            <td><strong>${f.nome}</strong></td>
            <td><span class="badge secondary" style="font-size:0.7rem;">${labelCat[cat] || cat}</span></td>
            <td>${f.nomeProduto}</td>
            <td>${f.quantidade}</td>
            <td>${formatarMoeda(custo)}</td>
            <td>${venda > 0 ? formatarMoeda(venda) : '<span style="color:#666;">—</span>'}</td>
            <td>${margemTxt}</td>
            <td>${formatarMoeda(f.quantidade * custo)}</td>
            <td>${formatarData(f.dataCadastro)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editarFornecedor('${f.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmarExcluirFornecedor('${f.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function editarFornecedor(id) {
    const f = getFornecedor(id);
    if (!f) return;
    document.getElementById('editarFornecedorId').value = id;
    document.getElementById('editarNomeFornecedor').value = f.nome;
    document.getElementById('editarTipoProdutoFornecedor').value = f.tipoProduto || '';
    document.getElementById('editarNomeProdutoFornecedor').value = f.nomeProduto;
    document.getElementById('editarQuantidadeFornecedor').value = f.quantidade;
    document.getElementById('editarValorUnitarioFornecedor').value = f.valorUnitario || 0;
    document.getElementById('editarValorVendaFornecedor').value = f.valorVendaUnit || 0;
    const cat = (f.categoriaEstoque || 'mercearia').toLowerCase();
    const labelCat = { cigarro: '🚬 Cigarros', bebida: '🍺 Bebidas', mercearia: '🏪 Mercearia' };
    const infoEl = document.getElementById('editarCategoriaDetectada');
    if (infoEl) infoEl.textContent = `Estoque: ${labelCat[cat] || cat}`;
    abrirModal('modalEditarFornecedor');
}

function confirmarExcluirFornecedor(id) {
    const f = getFornecedor(id);
    if (!f) return;
    if (confirm(`Excluir entrada de "${f.nomeProduto}" (${f.quantidade} un) do fornecedor "${f.nome}"?\n\nIsso vai REVERTER a quantidade no estoque.`)) {
        excluirFornecedor(id);
        mostrarToast('Fornecedor excluído e estoque revertido!', 'success');
        atualizarTabelaFornecedores();
        atualizarTelaEstoque();
        atualizarTelaBebidas();
        atualizarTelaMercearia();
        atualizarDashboard();
    }
}

// ============================================
// HISTÓRICO
// ============================================

function inicializarHistorico() {
    document.getElementById('btnFiltrarHistorico').addEventListener('click', atualizarTabelaHistorico);
    document.getElementById('btnLimparFiltro').addEventListener('click', () => {
        document.getElementById('filtroDataInicio').value = '';
        document.getElementById('filtroDataFim').value = '';
        document.getElementById('filtroTipo').value = 'todos';
        atualizarTabelaHistorico();
    });

    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    document.getElementById('filtroDataFim').value = hoje.toISOString().split('T')[0];
    document.getElementById('filtroDataInicio').value = seteDiasAtras.toISOString().split('T')[0];

    const btnPdfDiario = document.getElementById('btnPdfDiario');
    const btnPdfSemanal = document.getElementById('btnPdfSemanal');
    const btnPdfMensal = document.getElementById('btnPdfMensal');
    if (btnPdfDiario) btnPdfDiario.addEventListener('click', () => gerarRelatorioPDF('diario'));
    if (btnPdfSemanal) btnPdfSemanal.addEventListener('click', () => gerarRelatorioPDF('semanal'));
    if (btnPdfMensal) btnPdfMensal.addEventListener('click', () => gerarRelatorioPDF('mensal'));

    // Backup manual (exportar/restaurar)
    const btnExportarBackup = document.getElementById('btnExportarBackup');
    const btnRestaurarBackup = document.getElementById('btnRestaurarBackup');
    const inputArquivoBackup = document.getElementById('inputArquivoBackup');

    if (btnExportarBackup && typeof exportBackup === 'function') {
        btnExportarBackup.addEventListener('click', () => {
            try {
                const json = exportBackup();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const hoje = getDataAtual();
                a.href = url;
                a.download = `backup_cbp_bebidas_${hoje}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                mostrarToast('Backup exportado com sucesso!', 'success');
            } catch (e) {
                console.error(e);
                mostrarToast('Erro ao exportar backup.', 'error');
            }
        });
    }

    if (btnRestaurarBackup && inputArquivoBackup && typeof importBackup === 'function') {
        btnRestaurarBackup.addEventListener('click', () => {
            const confirmar = window.confirm('Restaurar um backup substituirá todos os dados atuais. Deseja continuar?');
            if (!confirmar) return;
            inputArquivoBackup.value = '';
            inputArquivoBackup.click();
        });

        inputArquivoBackup.addEventListener('change', (e) => {
            const arquivo = e.target.files && e.target.files[0];
            if (!arquivo) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const conteudo = ev.target.result;
                    const dados = JSON.parse(conteudo);

                    // Validação básica de estrutura
                    if (!dados || typeof dados !== 'object' || !dados.sales || !dados.stock) {
                        mostrarToast('Arquivo de backup inválido.', 'error');
                        return;
                    }

                    const ok = importBackup(dados);
                    if (ok) {
                        alert('Backup restaurado com sucesso.');
                        location.reload();
                    } else {
                        mostrarToast('Erro ao restaurar backup.', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    mostrarToast('Erro ao ler arquivo de backup.', 'error');
                }
            };
            reader.readAsText(arquivo, 'utf-8');
        });
    }
}

/**
 * Gera PDF de fechamento diário (formato profissional) ou vendas semanal/mensal.
 */
function gerarRelatorioPDF(periodo) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        mostrarToast('Biblioteca jsPDF não carregada. Verifique a conexão.', 'error');
        return;
    }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const agora = new Date();
    const hojeStr = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const footerStr = 'Gerado em ' + agora.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (periodo === 'diario') {
        const receitaHoje = typeof getReceitaHoje === 'function' ? getReceitaHoje() : 0;
        const vendasHoje = getVendasHoje();
        const vendasReceita = vendasHoje.filter(v => v.formaPagamento !== 'fiado');
        const lucro = calcularLucroVendas(vendasReceita);
        const totaisPag = { dinheiro: 0, debito: 0, credito: 0, pix: 0, fiado: 0 };
        vendasHoje.forEach(v => { if (totaisPag[v.formaPagamento] !== undefined) totaisPag[v.formaPagamento] += v.valor; });
        const fiadoDividas = typeof getFiadoVendasHoje === 'function' ? getFiadoVendasHoje() : totaisPag.fiado;
        totaisPag.fiado = fiadoDividas;
        const abertura = typeof getAberturaCaixaHoje === 'function' ? getAberturaCaixaHoje() : 0;
        const retiradas = typeof getRetiradasCaixaHoje === 'function' ? getRetiradasCaixaHoje() : 0;
        const top5 = typeof getTop5ProdutosVendidosHoje === 'function' ? getTop5ProdutosVendidosHoje() : getTop5ProdutosVendidos().slice(0, 5);

        let y = 18;
        doc.setFontSize(16);
        doc.text('CBP Bebidas', 14, y);
        y += 8;
        doc.setFontSize(12);
        doc.text('Relatório de Fechamento Diário - ' + hojeStr, 14, y);
        y += 12;
        doc.setFontSize(10);
        doc.text('Abertura de Caixa: ' + formatarMoeda(abertura), 14, y);
        y += 6;
        doc.text('Total de Vendas: ' + formatarMoeda(receitaHoje) + ' (somente recebido)', 14, y);
        y += 6;
        doc.text('Número de Vendas: ' + vendasHoje.length, 14, y);
        y += 6;
        doc.text('Retirada: ' + formatarMoeda(retiradas), 14, y);
        y += 6;
        doc.text('Lucro: ' + formatarMoeda(lucro), 14, y);
        y += 12;
        doc.setFont(undefined, 'bold');
        doc.text('Formas de pagamento:', 14, y);
        doc.setFont(undefined, 'normal');
        y += 6;
        doc.text('Dinheiro: ' + formatarMoeda(totaisPag.dinheiro), 14, y);
        y += 5;
        doc.text('Débito: ' + formatarMoeda(totaisPag.debito), 14, y);
        y += 5;
        doc.text('Crédito: ' + formatarMoeda(totaisPag.credito), 14, y);
        y += 5;
        doc.text('PIX: ' + formatarMoeda(totaisPag.pix), 14, y);
        y += 5;
        doc.text('Fiado (dívidas do dia): ' + formatarMoeda(totaisPag.fiado), 14, y);
        y += 10;
        doc.setFont(undefined, 'bold');
        doc.text('Top 5 produtos mais vendidos:', 14, y);
        doc.setFont(undefined, 'normal');
        y += 6;
        top5.forEach((p, i) => {
            doc.text((i + 1) + '. ' + (p.nome || 'Produto') + ' - ' + (p.quantidade || 0) + ' un', 18, y);
            y += 5;
        });
        y += 10;
        doc.setFontSize(9);
        doc.text(footerStr, 14, y);
        doc.save('relatorio-fechamento-diario-' + agora.toISOString().slice(0, 10) + '.pdf');
    } else {
        let titulo = '';
        let vendas = [];
        if (periodo === 'semanal') {
            titulo = 'Relatório de Vendas Semanais - ' + hojeStr;
            vendas = getVendasSemana();
        } else {
            titulo = 'Relatório de Vendas Mensais - ' + hojeStr;
            vendas = getVendasMes();
        }
        const totalVendas = calcularTotalVendas(vendas);
        const lucro = calcularLucroVendas(vendas);
        const totaisPag = { dinheiro: 0, debito: 0, credito: 0, pix: 0, fiado: 0 };
        vendas.forEach(v => { if (totaisPag[v.formaPagamento] !== undefined) totaisPag[v.formaPagamento] += v.valor; });
        const top5 = getTop5ProdutosVendidos();

        let y = 20;
        doc.setFontSize(14);
        doc.text('CBP Bebidas - Sistema ERP', 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.text(titulo, 14, y);
        y += 12;
        doc.setFontSize(10);
        doc.text('Total de vendas: ' + formatarMoeda(totalVendas), 14, y);
        y += 6;
        doc.text('Lucro: ' + formatarMoeda(lucro), 14, y);
        y += 10;
        doc.text('Formas de pagamento: Dinheiro ' + formatarMoeda(totaisPag.dinheiro) + ' | Débito ' + formatarMoeda(totaisPag.debito) + ' | Crédito ' + formatarMoeda(totaisPag.credito) + ' | PIX ' + formatarMoeda(totaisPag.pix) + ' | Fiado ' + formatarMoeda(totaisPag.fiado), 14, y);
        y += 10;
        doc.text('Top 5 produtos mais vendidos:', 14, y);
        y += 6;
        top5.forEach((p, i) => {
            doc.text((i + 1) + '. ' + (p.nome || 'Produto') + ' - ' + (p.quantidade || 0) + ' un', 18, y);
            y += 5;
        });
        y += 8;
        doc.setFontSize(9);
        doc.text(footerStr, 14, y);
        doc.save('relatorio-' + periodo + '-' + agora.toISOString().slice(0, 10) + '.pdf');
    }
    mostrarToast('PDF gerado com sucesso!', 'success');
}

function atualizarTabelaHistorico() {
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    const tipo = document.getElementById('filtroTipo').value;

    const historico = filtrarHistorico(dataInicio, dataFim, tipo);
    const tbody = document.querySelector('#tabelaHistorico tbody');
    if (!tbody) return;

    const iconesTipo = {
        venda: 'shopping-cart', cancelamento: 'times-circle', fiado: 'hand-holding-usd',
        pagamento: 'money-bill-wave', caixa: 'cash-register', cadastro: 'user-plus',
        estoque: 'boxes', fornecedor: 'truck'
    };

    const coresTipo = {
        venda: 'success', cancelamento: 'danger', fiado: 'warning', pagamento: 'info',
        caixa: 'primary', cadastro: 'cyan', estoque: 'purple', fornecedor: 'orange'
    };

    tbody.innerHTML = historico.map(h => `
        <tr>
            <td>${formatarDataHora(h.data)}</td>
            <td>
                <span class="badge ${coresTipo[h.tipo] || 'secondary'}">
                    <i class="fas fa-${iconesTipo[h.tipo] || 'circle'}"></i>
                    ${h.tipo.toUpperCase()}
                </span>
            </td>
            <td>${h.descricao}</td>
            <td class="${h.valor < 0 ? 'text-danger' : (h.valor > 0 ? 'text-success' : '')}">
                ${h.valor !== 0 ? formatarMoeda(Math.abs(h.valor)) : '-'}
            </td>
            <td>${h.cliente || '-'}</td>
        </tr>
    `).join('');
}

// ============================================
// INDICADOR DE ATALHOS DE TECLADO
// ============================================

function renderizarDicasAtalhos() {
    const container = document.getElementById('dicasAtalhos');
    if (!container) return;

    container.innerHTML = `
        <div class="atalhos-hint">
            <span class="atalho-badge"><kbd>1</kbd> Dinheiro</span>
            <span class="atalho-badge"><kbd>2</kbd> Débito</span>
            <span class="atalho-badge"><kbd>3</kbd> Crédito</span>
            <span class="atalho-badge"><kbd>4</kbd> Pix</span>
            <span class="atalho-badge"><kbd>5</kbd> Fiado</span>
            <span class="atalho-badge"><kbd>Enter</kbd> Registrar venda</span>
            <span class="atalho-badge"><kbd>F11</kbd> Tela Cheia</span>
        </div>
    `;
}

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================

const GESTAO_SENHA = '080521';
const GESTAO_PANEL_IDS = ['estoque', 'bebidas', 'mercearia', 'fornecedores', 'historico'];

// ============================================
// OPERADORES
// ============================================

function atualizarNomeOperadorNoHeader() {
    const el = document.getElementById('operadorAtivoTexto');
    if (!el) return;
    const op = typeof getOperadorAtivo === 'function' ? getOperadorAtivo() : null;
    el.textContent = op && op.nome ? op.nome : '—';
}

function inicializarOperadores() {
    atualizarNomeOperadorNoHeader();
    const btnTrocar = document.getElementById('btnTrocarOperador');
    if (btnTrocar) btnTrocar.addEventListener('click', () => {
        const sel = document.getElementById('selectOperador');
        if (sel) {
            sel.innerHTML = '<option value="">— Selecionar —</option>' +
                (typeof getOperadores === 'function' ? getOperadores() : []).map(o =>
                    `<option value="${o.id}">${o.nome || 'Operador ' + o.id}</option>`
                ).join('');
        }
        abrirModal('modalTrocarOperador');
    });

    document.getElementById('btnFecharModalOperador')?.addEventListener('click', () => fecharModal('modalTrocarOperador'));
    document.getElementById('btnCancelarOperador')?.addEventListener('click', () => fecharModal('modalTrocarOperador'));

    document.getElementById('btnConfirmarOperador')?.addEventListener('click', () => {
        const sel = document.getElementById('selectOperador');
        const id = sel && sel.value ? parseInt(sel.value, 10) : null;
        if (!id) { mostrarToast('Selecione um operador.', 'warning'); return; }
        const ops = typeof getOperadores === 'function' ? getOperadores() : [];
        const op = ops.find(o => o.id === id);
        if (op) {
            setOperadorAtivo(op);
            atualizarNomeOperadorNoHeader();
            fecharModal('modalTrocarOperador');
            mostrarToast('Operador: ' + (op.nome || op.id), 'success');
        }
    });

    document.getElementById('btnAdicionarOperador')?.addEventListener('click', () => {
        const nome = (document.getElementById('novoOperadorNome').value || '').trim();
        if (!nome) { mostrarToast('Digite o nome do operador.', 'error'); return; }
        const pin = (document.getElementById('novoOperadorPin').value || '').trim();
        const novo = addOperador({ nome, pin });
        setOperadorAtivo(novo);
        atualizarNomeOperadorNoHeader();
        document.getElementById('novoOperadorNome').value = '';
        document.getElementById('novoOperadorPin').value = '';
        fecharModal('modalTrocarOperador');
        mostrarToast('Operador cadastrado: ' + nome, 'success');
    });
}

function moverPainéisGestaoParaStorage() {
    const storage = document.getElementById('gestaoPanelsStorage');
    if (!storage) return;
    GESTAO_PANEL_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.parentNode !== storage) storage.appendChild(el);
    });
}

function mostrarPainelGestao(panelId) {
    const container = document.getElementById('gestaoPanelContainer');
    const balanco = document.getElementById('gestaoBalanco');
    const storage = document.getElementById('gestaoPanelsStorage');
    if (!container || !balanco) return;

    document.querySelectorAll('.gestao-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gestaoPanel === panelId);
    });

    if (panelId === 'balanco') {
        balanco.style.display = 'block';
        GESTAO_PANEL_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.parentNode === container) storage.appendChild(el);
        });
        if (typeof atualizarGestao === 'function') atualizarGestao();
        return;
    }

    balanco.style.display = 'none';
    const panelEl = document.getElementById(panelId);
    if (!panelEl) return;
    if (panelEl.parentNode !== container) container.appendChild(panelEl);
    panelEl.style.display = 'block';
    GESTAO_PANEL_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && id !== panelId && el.parentNode === container) {
            el.style.display = 'none';
            storage.appendChild(el);
        }
    });

    if (panelId === 'estoque') atualizarTelaEstoque();
    else if (panelId === 'bebidas') atualizarTelaBebidas();
    else if (panelId === 'mercearia') atualizarTelaMercearia();
    else if (panelId === 'fornecedores') {
        atualizarTabelaFornecedores();
        if (typeof atualizarCarteiraFornecedores === 'function') atualizarCarteiraFornecedores();
    } else if (panelId === 'historico') atualizarTabelaHistorico();
}

function inicializarGestao() {
    const btn = document.getElementById('btnGestaoEntrar');
    const inputSenha = document.getElementById('gestaoSenha');
    const gate = document.getElementById('gestaoGate');
    const conteudo = document.getElementById('gestaoConteudo');
    const erro = document.getElementById('gestaoErro');
    if (!btn || !inputSenha) return;
    btn.addEventListener('click', () => {
        const senha = (inputSenha.value || '').trim();
        if (senha === GESTAO_SENHA) {
            if (erro) erro.style.display = 'none';
            if (gate) gate.style.display = 'none';
            if (conteudo) conteudo.style.display = 'block';
            inputSenha.value = '';
            mostrarPainelGestao('balanco');
        } else {
            if (erro) { erro.style.display = 'block'; erro.textContent = 'Senha incorreta.'; }
            mostrarToast('Senha incorreta. Acesso negado.', 'error');
        }
    });
    inputSenha.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });

    document.querySelectorAll('.gestao-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => mostrarPainelGestao(btn.dataset.gestaoPanel || 'balanco'));
    });
}

function atualizarGestao() {
    const vendas = (typeof getVendas === 'function' ? getVendas() : []).filter(v => !v.cancelada);
    const receita = typeof calcularTotalVendas === 'function' ? calcularTotalVendas(vendas) : 0;
    const lucroTotal = typeof calcularLucroVendas === 'function' ? calcularLucroVendas(vendas) : 0;
    const custoTotal = receita - lucroTotal;
    const margemPct = receita > 0 ? ((lucroTotal / receita) * 100) : 0;

    const vendaHoje = typeof getReceitaHoje === 'function' ? getReceitaHoje() : 0;
    const vendaSemana = typeof getVendasSemana === 'function' ? calcularTotalVendas(getVendasSemana()) : 0;
    const vendaMes = typeof getVendasMes === 'function' ? calcularTotalVendas(getVendasMes()) : 0;
    const maisLucrativo = typeof getProdutoMaisLucrativo === 'function' ? getProdutoMaisLucrativo() : null;
    const totalFiado = typeof calcularTotalFiado === 'function' ? calcularTotalFiado() : 0;

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('gestaoVendaHoje', formatarMoeda(vendaHoje));
    set('gestaoVendaSemana', formatarMoeda(vendaSemana));
    set('gestaoVendaMes', formatarMoeda(vendaMes));
    set('gestaoItemMaisLucrativo', maisLucrativo && (maisLucrativo.vendasTotais || 0) > 0
        ? `${maisLucrativo.marca || ''} ${maisLucrativo.tipo || ''}` : '-');
    set('gestaoTotalFiado', formatarMoeda(totalFiado));
    set('gestaoMargemPct', margemPct.toFixed(1) + '%');
    set('gestaoLucroTotal', formatarMoeda(lucroTotal));
    set('gestaoReceita', formatarMoeda(receita));
    set('gestaoCustoReceita', formatarMoeda(custoTotal) + ' / ' + formatarMoeda(receita));

    if (typeof criarGraficosGestao === 'function') criarGraficosGestao({ receita, custoTotal, lucroTotal, margemPct, vendas });
}

function inicializarApp() {
    console.log('Inicializando CBP Bebidas ERP v2.0...');

    inicializarNavegacao();
    inicializarTelaCheia();
    inicializarAtalhos();
    inicializarVendas();
    inicializarCaixa();
    inicializarFiado();
    inicializarEstoque();
    inicializarBebidas();
    inicializarMercearia();
    inicializarFornecedores();
    inicializarHistorico();
    inicializarGestao();
    moverPainéisGestaoParaStorage();
    inicializarOperadores();

    atualizarDashboard();

    // Backup automático diário: cria 1 backup por dia e mantém apenas os 7 últimos
    try {
        const hoje = typeof getDataAtual === 'function' ? getDataAtual() : new Date().toISOString().split('T')[0];
        const ultimaData = localStorage.getItem('cbp_auto_backup_last_date');
        if (hoje && ultimaData !== hoje && typeof createAutoBackup === 'function') {
            createAutoBackup();
            localStorage.setItem('cbp_auto_backup_last_date', hoje);
        }
    } catch (e) {
        console.error('Falha ao criar backup automático:', e);
    }

    // Inicializa seletor de período
    const seletorPeriodo = document.getElementById('seletorPeriodoVendas');
    if (seletorPeriodo) {
        seletorPeriodo.addEventListener('change', () => {
            criarGraficoVendasComSeletor(seletorPeriodo.value);
        });
    }

    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);

    renderizarDicasAtalhos();

    console.log('Sistema v2.0 inicializado com sucesso!');
    mostrarToast('CBP Bebidas ERP v2.0 — Bem-vindo!', 'success');
}

document.addEventListener('DOMContentLoaded', inicializarApp);
