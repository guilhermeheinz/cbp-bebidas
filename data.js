/**
 * ============================================
 * CBP BEBIDAS - SISTEMA DE DADOS v2.0
 * ============================================
 * Extensões: lucro, ranking, estoque mínimo global, pacote cigarro/bebida,
 * fornecedores cadastro + compras, custo por item na venda.
 *
 * ESTRUTURA CIGARRO (hierárquica):
 * 1 Maço = 10 Carteiras | 1 Carteira = 20 unidades
 * Total unidades = quantidadeMacos*200 + quantidadeCarteiras*20 + quantidade (soltos)
 * Custo: registrado por MAÇO (valorCustoCarteira passa a representar o custo do maço).
 *
 * ESTRUTURA BEBIDA (lata):
 * 1 Caixa = 12 unidades. Compra em caixas aumenta quantidadeCaixas.
 * Venda: 12 unidades reduz 1 caixa; venda 1 caixa reduz 12 unidades.
 */

// Estoque mínimo padrão quando não definido por produto (alertas globais)
const ESTOQUE_MINIMO_GLOBAL = 10;

// Cigarro: 1 maço = 10 carteiras = 200 unidades
const CIGARRO_CARTEIRAS_POR_MACO = 10;
const CIGARRO_UNIDADES_POR_CARTEIRA = 20;
const CIGARRO_UNIDADES_POR_MACO = CIGARRO_CARTEIRAS_POR_MACO * CIGARRO_UNIDADES_POR_CARTEIRA; // 200

// Bebida (lata): 1 caixa = 12 unidades
const BEBIDA_UNIDADES_POR_CAIXA = 12;

// ============================================
// CONFIGURAÇÃO INICIAL
// ============================================

function inicializarSistema() {
    if (!localStorage.getItem('cbp_inicializado')) {
        console.log('Inicializando sistema pela primeira vez...');

        localStorage.setItem('cbp_vendas', JSON.stringify([]));
        localStorage.setItem('cbp_clientes', JSON.stringify([]));
        localStorage.setItem('cbp_fornecedores', JSON.stringify([]));
        localStorage.setItem('cbp_historico', JSON.stringify([]));
        localStorage.setItem('cbp_suppliers', JSON.stringify([]));
        localStorage.setItem('cbp_compras', JSON.stringify([]));
        localStorage.setItem('cbp_operadores', JSON.stringify([]));
        localStorage.setItem('cbp_operador_ativo', JSON.stringify(null));

        const caixaInicial = {
            aberto: false,
            dataAbertura: null,
            valorInicial: 0,
            vendas: [],
            movimentacoes: []
        };
        localStorage.setItem('cbp_caixa', JSON.stringify(caixaInicial));

        const estoqueInicial = criarEstoqueInicial();
        localStorage.setItem('cbp_estoque', JSON.stringify(estoqueInicial));

        localStorage.setItem('cbp_bebidas', JSON.stringify(criarBebidasInicial()));
        localStorage.setItem('cbp_mercearia', JSON.stringify([]));

        localStorage.setItem('cbp_inicializado', 'true');
        console.log('Sistema inicializado com sucesso!');
    } else {
        if (!localStorage.getItem('cbp_bebidas')) {
            localStorage.setItem('cbp_bebidas', JSON.stringify(criarBebidasInicial()));
        }
        if (!localStorage.getItem('cbp_mercearia')) {
            localStorage.setItem('cbp_mercearia', JSON.stringify([]));
        }
        if (!localStorage.getItem('cbp_suppliers')) {
            localStorage.setItem('cbp_suppliers', JSON.stringify([]));
        }
        if (!localStorage.getItem('cbp_compras')) {
            localStorage.setItem('cbp_compras', JSON.stringify([]));
        }
        if (!localStorage.getItem('cbp_operadores')) {
            localStorage.setItem('cbp_operadores', JSON.stringify([]));
        }
        if (!localStorage.getItem('cbp_operador_ativo')) {
            localStorage.setItem('cbp_operador_ativo', JSON.stringify(null));
        }
    }
}

// ============================================
// OPERADORES (POS)
// ============================================

function getOperadores() {
    return JSON.parse(localStorage.getItem('cbp_operadores') || '[]');
}

function setOperadores(lista) {
    localStorage.setItem('cbp_operadores', JSON.stringify(lista));
}

function addOperador(operador) {
    const lista = getOperadores();
    const id = lista.length ? Math.max(...lista.map(o => o.id)) + 1 : 1;
    const novo = { id, nome: operador.nome || '', pin: operador.pin || '' };
    lista.push(novo);
    setOperadores(lista);
    return novo;
}

function getOperadorAtivo() {
    const raw = localStorage.getItem('cbp_operador_ativo');
    return raw ? JSON.parse(raw) : null;
}

function setOperadorAtivo(operador) {
    localStorage.setItem('cbp_operador_ativo', JSON.stringify(operador));
}

function criarEstoqueInicial() {
    const marcas = {
        'Kent': ['Kent', 'Kent Azul', 'Kent Vermelho', 'Kent Prata', 'Kent Series Silver', 'Kent Series Blue'],
        'Rothmans': ['Rothmans', 'Rothmans Azul', 'Rothmans Vermelho', 'Rothmans Prata', 'Rothmans Global',
            'Rothmans Azul e Branco', 'Rothmans Longo', 'Rothmans Melancia', 'Rothmans Melão', 'Rothmans Purple Boost'],
        'Lucky Strike': ['Lucky Strike', 'Lucky Strike Menta', 'Lucky Strike Double'],
        'Dunhill': ['Dunhill', 'Dunhill Carlton Vermelho', 'Dunhill Carlton Azul', 'Dunhill Carlton Cereja',
            'Dunhill Free Azul', 'Dunhill Free Vermelho'],
        'WS': ['WS', 'WS Vermelho'],
        'Gift': ['Gift', 'Gift Azul', 'Gift Vermelho'],
        'Camel': ['Camel', 'Camel Purple Beach', 'Camel Double', 'Camel Azul', 'Camel Amarelo',
            'Camel Kretek Menta', 'Camel Kretek Cereja'],
        'Winston': ['Winston', 'Winston Vermelho', 'Winston Azul', 'Winston Silver', 'Winston Select']
    };

    const estoque = [];
    let id = 1;

    for (const [marca, tipos] of Object.entries(marcas)) {
        tipos.forEach(tipo => {
            estoque.push({
                id: id++,
                marca: marca,
                tipo: tipo === marca ? 'Tradicional' : tipo.replace(marca + ' ', ''),
                categoria: 'cigarro',
                quantidade: 0,
                quantidadeMacos: 0,
                quantidadeCarteiras: 0,
                valorVenda: 0,
                valorCusto: 0,
                valorCustoCarteira: 0,
                valorVendaPacote: 0,
                valorVendaCarteira: 0,
                valorVendaMaco: 0,
                unidadesPorPacote: CIGARRO_UNIDADES_POR_CARTEIRA,
                vendasTotais: 0,
                estoqueMinimo: ESTOQUE_MINIMO_GLOBAL,
                dataCadastro: new Date().toISOString()
            });
        });
    }

    return estoque;
}

/**
 * Cria estoque inicial de bebidas (cervejas e outros)
 */
function criarBebidasInicial() {
    return [
        {
            id: 1,
            nome: 'Brahma Lata 350ml',
            categoria: 'cerveja',
            unidadesPorCaixa: BEBIDA_UNIDADES_POR_CAIXA,
            unidadesPorPacote: 0,
            quantidadeUnidades: 0,
            quantidadeCaixas: 0,
            quantidadePacotes: 0,
            valorVendaUnidade: 0,
            valorVendaCaixa: 0,
            valorVendaPacote: 0,
            valorCustoUnidade: 0,
            valorCustoCaixa: 0,
            vendasTotaisUnidades: 0,
            estoqueMinimo: ESTOQUE_MINIMO_GLOBAL,
            dataCadastro: new Date().toISOString()
        },
        {
            id: 2,
            nome: 'Skol Lata 350ml',
            categoria: 'cerveja',
            unidadesPorCaixa: BEBIDA_UNIDADES_POR_CAIXA,
            unidadesPorPacote: 0,
            quantidadeUnidades: 0,
            quantidadeCaixas: 0,
            quantidadePacotes: 0,
            valorVendaUnidade: 0,
            valorVendaCaixa: 0,
            valorVendaPacote: 0,
            valorCustoUnidade: 0,
            valorCustoCaixa: 0,
            vendasTotaisUnidades: 0,
            estoqueMinimo: ESTOQUE_MINIMO_GLOBAL,
            dataCadastro: new Date().toISOString()
        },
        {
            id: 3,
            nome: 'Heineken Garrafa 330ml',
            categoria: 'cerveja',
            unidadesPorCaixa: 24,
            unidadesPorPacote: 6,
            quantidadeUnidades: 0,
            quantidadeCaixas: 0,
            quantidadePacotes: 0,
            valorVendaUnidade: 0,
            valorVendaCaixa: 0,
            valorVendaPacote: 0,
            valorCustoUnidade: 0,
            valorCustoCaixa: 0,
            vendasTotaisUnidades: 0,
            estoqueMinimo: ESTOQUE_MINIMO_GLOBAL,
            dataCadastro: new Date().toISOString()
        }
    ];
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function formatarData(dataISO) {
    if (!dataISO) return '-';
    return new Date(dataISO).toLocaleDateString('pt-BR');
}

function formatarDataHora(dataISO) {
    if (!dataISO) return '-';
    return new Date(dataISO).toLocaleString('pt-BR');
}

function getDataAtual() {
    return new Date().toISOString().split('T')[0];
}

function getDataHoraAtual() {
    return new Date().toISOString();
}

// ============================================
// OPERAÇÕES CRUD - VENDAS
// ============================================

function getVendas() {
    return JSON.parse(localStorage.getItem('cbp_vendas') || '[]');
}

function setVendas(vendas) {
    localStorage.setItem('cbp_vendas', JSON.stringify(vendas));
}

/**
 * Adiciona uma nova venda com suporte a desconto e integração de estoque
 * @param {Object} venda - Objeto da venda
 * @param {number} venda.valor - Valor original
 * @param {number} venda.desconto - Desconto aplicado (opcional)
 * @param {string} venda.formaPagamento
 * @param {Array}  venda.itens - Itens vendidos (para baixa no estoque)
 */
function adicionarVenda(venda) {
    const vendas = getVendas();
    const desconto = parseFloat(venda.desconto) || 0;
    const valorFinal = Math.max(0, (venda.valor || 0) - desconto);

    // Garante custo por item para cálculo de lucro (preço venda - custo)
    const itensComCusto = (venda.itens || []).map(item => {
        let custo = item.custo != null ? item.custo : 0;
        if (item.tipo === 'cigarro') {
            const p = getProduto(item.id);
            if (p) custo = p.valorCusto || 0;
        } else if (item.tipo === 'bebida') {
            const b = getBebida(item.id);
            if (b) custo = (b.valorCustoUnidade || 0);
        } else if (item.tipo === 'mercearia') {
            const m = getItemMercearia(item.id);
            if (m) custo = m.valorCusto || 0;
        }
        return { ...item, custo };
    });

    const operador = getOperadorAtivo();
    const novaVenda = {
        id: gerarId(),
        data: getDataHoraAtual(),
        dataCurta: getDataAtual(),
        ...venda,
        itens: itensComCusto.length ? itensComCusto : venda.itens,
        desconto: desconto,
        valorOriginal: venda.valor,
        valor: valorFinal,
        cancelada: false,
        operadorId: venda.operadorId != null ? venda.operadorId : (operador && operador.id),
        operadorNome: venda.operadorNome || (operador && operador.nome) || ''
    };
    vendas.push(novaVenda);
    setVendas(vendas);

    // Baixa no estoque se houver itens
    if (novaVenda.itens && novaVenda.itens.length > 0) {
        novaVenda.itens.forEach(item => {
            if (item.tipo === 'cigarro') {
                registrarVendaProduto(item.id, item.quantidade || 1, item.modalidade || 'unidade');
            } else if (item.tipo === 'bebida') {
                registrarVendaBebida(item.id, item.quantidade || 1, item.modalidade || 'unidade');
            } else if (item.tipo === 'mercearia') {
                registrarVendaMercearia(item.id, item.quantidade || 1);
            }
        });
    }

    // Adiciona ao histórico
    adicionarHistorico({
        tipo: 'venda',
        descricao: `Venda - ${venda.formaPagamento.toUpperCase()}${desconto > 0 ? ` (Desconto: ${formatarMoeda(desconto)})` : ''}`,
        valor: valorFinal,
        referencia: novaVenda.id,
        cliente: venda.clienteNome || '-'
    });

    // Adiciona ao caixa apenas vendas com pagamento recebido (fiado não é receita no caixa)
    const caixa = getCaixa();
    if (caixa.aberto && venda.formaPagamento !== 'fiado') {
        caixa.vendas.push(novaVenda.id);
        setCaixa(caixa);
    }

    return novaVenda;
}

function cancelarVenda(id) {
    const vendas = getVendas();
    const venda = vendas.find(v => v.id === id);

    if (venda && !venda.cancelada) {
        venda.cancelada = true;
        venda.dataCancelamento = getDataHoraAtual();
        setVendas(vendas);

        // Devolve ao estoque se havia itens
        if (venda.itens && venda.itens.length > 0) {
            venda.itens.forEach(item => {
                const qty = item.quantidade || 1;
                const modalidade = item.modalidade || 'unidade';
                if (item.tipo === 'cigarro') {
                    const produto = getProduto(item.id);
                    if (produto) {
                        let unidadesDevolvidas = qty;
                        if (modalidade === 'carteira' || modalidade === 'pacote') unidadesDevolvidas = qty * CIGARRO_UNIDADES_POR_CARTEIRA;
                        else if (modalidade === 'maco') unidadesDevolvidas = qty * CIGARRO_UNIDADES_POR_MACO;
                        const totalAgora = getTotalUnidadesCigarro(produto) + unidadesDevolvidas;
                        produto.quantidade = totalAgora % CIGARRO_UNIDADES_POR_CARTEIRA;
                        const restC = Math.floor(totalAgora / CIGARRO_UNIDADES_POR_CARTEIRA);
                        produto.quantidadeCarteiras = restC % CIGARRO_CARTEIRAS_POR_MACO;
                        produto.quantidadeMacos = Math.floor(restC / CIGARRO_CARTEIRAS_POR_MACO);
                        produto.vendasTotais = Math.max(0, (produto.vendasTotais || 0) - unidadesDevolvidas);
                        atualizarProduto(produto);
                    }
                } else if (item.tipo === 'bebida') {
                    devolverEstoqueBebida(item.id, qty, modalidade);
                } else if (item.tipo === 'mercearia') {
                    const mItem = getItemMercearia(item.id);
                    if (mItem) {
                        mItem.quantidade = (mItem.quantidade || 0) + qty;
                        atualizarItemMercearia(mItem);
                    }
                }
            });
        }

        if (venda.clienteId) {
            const cliente = getCliente(venda.clienteId);
            if (cliente) {
                cliente.saldo = Math.max(0, cliente.saldo - venda.valor);
                atualizarCliente(cliente);
            }
        }

        adicionarHistorico({
            tipo: 'cancelamento',
            descricao: `Cancelamento de venda`,
            valor: venda.valor,
            referencia: id,
            cliente: venda.clienteNome || '-'
        });

        return true;
    }
    return false;
}

function getVendasHoje() {
    const hoje = getDataAtual();
    return getVendas().filter(v => v.dataCurta === hoje && !v.cancelada);
}

/** Receita de hoje: apenas valores recebidos (exclui vendas fiado, inclui pagamentos de fiado). */
function getReceitaHoje() {
    const hoje = getDataAtual();
    const vendasHoje = getVendasHoje();
    const receitaVendas = vendasHoje.filter(v => v.formaPagamento !== 'fiado').reduce((s, v) => s + (v.valor || 0), 0);
    const historicoHoje = getHistorico().filter(h => h.dataCurta === hoje && h.tipo === 'pagamento');
    const pagamentosFiado = historicoHoje.reduce((s, h) => s + (h.valor || 0), 0);
    return receitaVendas + pagamentosFiado;
}

/** Valor adicionado às dívidas (vendas fiado) hoje. Não é receita. */
function getFiadoVendasHoje() {
    return getVendasHoje().filter(v => v.formaPagamento === 'fiado').reduce((s, v) => s + (v.valor || 0), 0);
}

/** Pagamentos de fiado recebidos hoje (conta como receita). */
function getPagamentosFiadoHoje() {
    const hoje = getDataAtual();
    return getHistorico()
        .filter(h => h.dataCurta === hoje && h.tipo === 'pagamento')
        .reduce((s, h) => s + (h.valor || 0), 0);
}

/** Valor de abertura de caixa hoje (do histórico). */
function getAberturaCaixaHoje() {
    const hoje = getDataAtual();
    const h = getHistorico().find(x => x.dataCurta === hoje && x.descricao && x.descricao.includes('Abertura de caixa'));
    return h ? (h.valor || 0) : 0;
}

/** Total de retiradas de caixa hoje (do histórico). */
function getRetiradasCaixaHoje() {
    const hoje = getDataAtual();
    return getHistorico()
        .filter(h => h.dataCurta === hoje && h.descricao && h.descricao.startsWith('Retirada'))
        .reduce((s, h) => s + Math.abs(h.valor || 0), 0);
}

function getVendasSemana() {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    return getVendas().filter(v => {
        const dataVenda = new Date(v.data);
        return dataVenda >= inicioSemana && !v.cancelada;
    });
}

function getVendasMes() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    return getVendas().filter(v => {
        const dataVenda = new Date(v.data);
        return dataVenda.getMonth() === mesAtual &&
            dataVenda.getFullYear() === anoAtual &&
            !v.cancelada;
    });
}

function calcularTotalVendas(vendas) {
    return vendas.reduce((total, v) => total + (v.valor || 0), 0);
}

/**
 * Lucro = preço venda - custo por item (acumulado nas vendas).
 * Itens sem custo salvo usam custo atual do produto quando disponível.
 */
function calcularLucroVendas(vendas) {
    let lucro = 0;
    vendas.forEach(v => {
        if (!v.itens || !v.itens.length) return;
        v.itens.forEach(item => {
            const custoUnit = item.custo != null ? item.custo : (item.tipo === 'cigarro' ? (getProduto(item.id) && getProduto(item.id).valorCusto) : (item.tipo === 'bebida' ? (getBebida(item.id) && getBebida(item.id).valorCustoUnidade) : (item.tipo === 'mercearia' ? (getItemMercearia(item.id) && getItemMercearia(item.id).valorCusto) : 0))) || 0;
            const preco = item.preco || 0;
            const qty = item.quantidade || 1;
            const mod = item.modalidade || 'unidade';
            let unidades = qty;
            if (item.tipo === 'cigarro' && mod === 'pacote') unidades = qty * (getProduto(item.id)?.unidadesPorPacote || 20);
            else if (item.tipo === 'bebida' && mod === 'caixa') unidades = qty * (getBebida(item.id)?.unidadesPorCaixa || 24);
            else if (item.tipo === 'bebida' && mod === 'pacote') unidades = qty * (getBebida(item.id)?.unidadesPorPacote || 6);
            lucro += preco * qty - unidades * custoUnit;
        });
    });
    return lucro;
}

function getLucroHoje() {
    return calcularLucroVendas(getVendasHoje());
}

function getLucroSemana() {
    return calcularLucroVendas(getVendasSemana());
}

function getLucroMes() {
    return calcularLucroVendas(getVendasMes());
}

/**
 * Top 5 produtos mais vendidos por quantidade hoje.
 */
function getTop5ProdutosVendidosHoje() {
    const vendas = getVendasHoje().filter(v => v.itens && v.itens.length);
    const map = {};
    vendas.forEach(v => {
        v.itens.forEach(item => {
            const key = item.tipo + '_' + item.id;
            if (!map[key]) {
                let nome = item.nome;
                if (!nome && item.tipo === 'cigarro') {
                    const p = getProduto(item.id);
                    nome = p ? `${p.marca} ${p.tipo}` : 'Cigarro';
                } else if (!nome && item.tipo === 'bebida') {
                    const b = getBebida(item.id);
                    nome = b ? b.nome : 'Bebida';
                } else if (!nome && item.tipo === 'mercearia') {
                    const m = getItemMercearia(item.id);
                    nome = m ? m.nome : 'Mercearia';
                }
                map[key] = { nome: nome || 'Produto', quantidade: 0 };
            }
            const qty = item.quantidade || 1;
            const mod = item.modalidade || 'unidade';
            if (item.tipo === 'cigarro' && (mod === 'carteira' || mod === 'pacote')) map[key].quantidade += qty * CIGARRO_UNIDADES_POR_CARTEIRA;
            else if (item.tipo === 'cigarro' && mod === 'maco') map[key].quantidade += qty * CIGARRO_UNIDADES_POR_MACO;
            else if (item.tipo === 'bebida' && mod === 'caixa') map[key].quantidade += qty * (getBebida(item.id)?.unidadesPorCaixa || 12);
            else map[key].quantidade += qty;
        });
    });
    return Object.values(map).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
}

/**
 * Top 5 produtos mais vendidos por quantidade (todas as vendas).
 */
function getTop5ProdutosVendidos() {
    const vendas = getVendas().filter(v => !v.cancelada && v.itens && v.itens.length);
    const map = {};
    vendas.forEach(v => {
        v.itens.forEach(item => {
            const key = item.tipo + '_' + item.id;
            if (!map[key]) {
                let nome = item.nome;
                if (!nome && item.tipo === 'cigarro') {
                    const p = getProduto(item.id);
                    nome = p ? `${p.marca} ${p.tipo}` : 'Cigarro';
                } else if (!nome && item.tipo === 'bebida') {
                    const b = getBebida(item.id);
                    nome = b ? b.nome : 'Bebida';
                } else if (!nome && item.tipo === 'mercearia') {
                    const m = getItemMercearia(item.id);
                    nome = m ? m.nome : 'Mercearia';
                }
                map[key] = { tipo: item.tipo, id: item.id, nome: nome || 'Produto', quantidade: 0 };
            }
            map[key].quantidade += item.quantidade || 1;
            if (item.nome) map[key].nome = item.nome;
        });
    });
    return Object.values(map)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
}

// ============================================
// OPERAÇÕES CRUD - CLIENTES (FIADO)
// ============================================

function getClientes() {
    return JSON.parse(localStorage.getItem('cbp_clientes') || '[]');
}

function setClientes(clientes) {
    localStorage.setItem('cbp_clientes', JSON.stringify(clientes));
}

function getCliente(id) {
    return getClientes().find(c => c.id === id) || null;
}

function adicionarCliente(cliente) {
    const clientes = getClientes();
    const novoCliente = {
        id: gerarId(),
        dataCadastro: getDataHoraAtual(),
        saldo: 0,
        historicoCompras: [],
        historicoPagamentos: [],
        ...cliente
    };
    clientes.push(novoCliente);
    setClientes(clientes);

    adicionarHistorico({
        tipo: 'cadastro',
        descricao: `Cadastro de cliente: ${cliente.nome}`,
        valor: 0,
        referencia: novoCliente.id,
        cliente: cliente.nome
    });

    return novoCliente;
}

function atualizarCliente(cliente) {
    const clientes = getClientes();
    const index = clientes.findIndex(c => c.id === cliente.id);
    if (index !== -1) {
        clientes[index] = cliente;
        setClientes(clientes);
    }
}

function adicionarCompraCliente(clienteId, compra) {
    const cliente = getCliente(clienteId);
    if (cliente) {
        cliente.historicoCompras.push({
            id: gerarId(),
            data: getDataHoraAtual(),
            ...compra
        });
        cliente.saldo += compra.valor;
        atualizarCliente(cliente);

        adicionarHistorico({
            tipo: 'fiado',
            descricao: `Venda fiado`,
            valor: compra.valor,
            referencia: compra.vendaId,
            cliente: cliente.nome
        });
    }
}

function registrarPagamentoCliente(clienteId, valor, tipo) {
    const cliente = getCliente(clienteId);
    if (cliente && valor > 0) {
        cliente.historicoPagamentos.push({
            id: gerarId(),
            data: getDataHoraAtual(),
            valor: valor,
            tipo: tipo
        });
        cliente.saldo = Math.max(0, cliente.saldo - valor);
        atualizarCliente(cliente);

        adicionarHistorico({
            tipo: 'pagamento',
            descricao: `Pagamento ${tipo}`,
            valor: valor,
            referencia: clienteId,
            cliente: cliente.nome
        });

        return true;
    }
    return false;
}

function calcularTotalFiado() {
    return getClientes().reduce((total, c) => total + (c.saldo || 0), 0);
}

/**
 * Remove cliente apenas se o saldo (dívida) for zero.
 * @returns {boolean} true se excluiu, false se bloqueado por dívida
 */
function excluirCliente(id) {
    const cliente = getCliente(id);
    if (!cliente) return false;
    if ((cliente.saldo || 0) > 0) return false;
    const clientes = getClientes().filter(c => c.id !== id);
    setClientes(clientes);
    adicionarHistorico({
        tipo: 'cadastro',
        descricao: `Exclusão de cliente: ${cliente.nome}`,
        valor: 0,
        referencia: id,
        cliente: '-'
    });
    return true;
}

// ============================================
// OPERAÇÕES CRUD - ESTOQUE (CIGARROS)
// ============================================

function getEstoque() {
    return JSON.parse(localStorage.getItem('cbp_estoque') || '[]');
}

function setEstoque(estoque) {
    localStorage.setItem('cbp_estoque', JSON.stringify(estoque));
}

function getProduto(id) {
    return getEstoque().find(p => p.id === id) || null;
}

/** Total de unidades de cigarro: maços*200 + carteiras*20 + unidades soltas */
function getTotalUnidadesCigarro(p) {
    return (p.quantidadeMacos || 0) * CIGARRO_UNIDADES_POR_MACO
        + (p.quantidadeCarteiras || 0) * CIGARRO_UNIDADES_POR_CARTEIRA
        + (p.quantidade || 0);
}

function adicionarProduto(produto) {
    const estoque = getEstoque();
    const novoProduto = {
        id: estoque.length > 0 ? Math.max(...estoque.map(p => p.id)) + 1 : 1,
        dataCadastro: getDataHoraAtual(),
        vendasTotais: 0,
        estoqueMinimo: produto.estoqueMinimo != null ? produto.estoqueMinimo : ESTOQUE_MINIMO_GLOBAL,
        categoria: 'cigarro',
        quantidade: produto.quantidade || 0,
        quantidadeMacos: produto.quantidadeMacos || 0,
        quantidadeCarteiras: produto.quantidadeCarteiras || 0,
        unidadesPorPacote: CIGARRO_UNIDADES_POR_CARTEIRA,
        valorVenda: 0,
        valorCustoCarteira: 0,
        valorVendaPacote: 0,
        valorVendaCarteira: 0,
        valorVendaMaco: 0,
        ...produto
    };
    estoque.push(novoProduto);
    setEstoque(estoque);

    adicionarHistorico({
        tipo: 'estoque',
        descricao: `Cadastro de produto: ${produto.marca} ${produto.tipo}`,
        valor: 0,
        referencia: novoProduto.id.toString(),
        cliente: '-'
    });

    return novoProduto;
}

function atualizarProduto(produto) {
    const estoque = getEstoque();
    const index = estoque.findIndex(p => p.id === produto.id);
    if (index !== -1) {
        estoque[index] = produto;
        setEstoque(estoque);
    }
}

/**
 * Converte 1 maço em 10 carteiras.
 * Usado apenas durante a venda (nunca na compra).
 */
function convertPackToCartons(produto) {
    if (!produto || (produto.quantidadeMacos || 0) <= 0) return false;
    produto.quantidadeMacos = (produto.quantidadeMacos || 0) - 1;
    produto.quantidadeCarteiras = (produto.quantidadeCarteiras || 0) + CIGARRO_CARTEIRAS_POR_MACO;
    return true;
}

/**
 * Converte 1 carteira em 20 unidades soltas.
 * Usado apenas durante a venda (nunca na compra).
 */
function convertCartonToUnits(produto) {
    if (!produto || (produto.quantidadeCarteiras || 0) <= 0) return false;
    produto.quantidadeCarteiras = (produto.quantidadeCarteiras || 0) - 1;
    produto.quantidade = (produto.quantidade || 0) + CIGARRO_UNIDADES_POR_CARTEIRA;
    return true;
}

/**
 * Vende unidades de cigarro, fazendo conversões dinâmicas:
 * - se faltar unidade solta, quebra 1 carteira em 20 unidades;
 * - se não houver carteira, converte 1 maço em 10 carteiras e depois
 *   quebra 1 carteira em 20 unidades.
 */
function sellCigaretteUnit(produto, quantidadeUnidades) {
    if (!produto || quantidadeUnidades <= 0) return false;
    let restantes = quantidadeUnidades;

    while (restantes > 0) {
        const soltas = produto.quantidade || 0;

        // Se já há unidades soltas suficientes, apenas desconta
        if (soltas >= restantes) {
            produto.quantidade = soltas - restantes;
            restantes = 0;
            break;
        }

        // Consome o que houver de unidades soltas
        if (soltas > 0) {
            produto.quantidade = 0;
            restantes -= soltas;
        }

        // Precisa de mais unidades: tenta quebrar carteira
        if ((produto.quantidadeCarteiras || 0) > 0) {
            convertCartonToUnits(produto);
            continue;
        }

        // Sem carteira: tenta converter 1 maço em carteiras e depois em unidades
        if ((produto.quantidadeMacos || 0) > 0) {
            convertPackToCartons(produto);
            convertCartonToUnits(produto);
            continue;
        }

        // Sem estoque suficiente
        return false;
    }

    // Atualiza métrica de vendas totais em unidades
    produto.vendasTotais = (produto.vendasTotais || 0) + quantidadeUnidades;
    return true;
}

/**
 * Vende carteiras (cartons) de cigarro, convertendo maços em carteiras
 * quando não houver carteiras suficientes.
 */
function sellCigaretteCarton(produto, quantidadeCarteiras) {
    if (!produto || quantidadeCarteiras <= 0) return false;

    const totalCartoesDisponiveis =
        (produto.quantidadeCarteiras || 0) +
        (produto.quantidadeMacos || 0) * CIGARRO_CARTEIRAS_POR_MACO;
    if (totalCartoesDisponiveis < quantidadeCarteiras) return false;

    let restantes = quantidadeCarteiras;

    while (restantes > 0) {
        if ((produto.quantidadeCarteiras || 0) > 0) {
            produto.quantidadeCarteiras -= 1;
            restantes -= 1;
            continue;
        }

        if ((produto.quantidadeMacos || 0) > 0) {
            convertPackToCartons(produto);
            continue;
        }

        // Não deveria acontecer por causa do teste inicial, mas por segurança:
        return false;
    }

    // Cada carteira representa 20 unidades vendidas
    const unidadesVendidas = quantidadeCarteiras * CIGARRO_UNIDADES_POR_CARTEIRA;
    produto.vendasTotais = (produto.vendasTotais || 0) + unidadesVendidas;
    return true;
}

/**
 * Venda de cigarro respeitando a hierarquia:
 * - estoque entra sempre em maços (compras);
 * - conversões maço→carteira e carteira→unidade acontecem apenas na venda.
 * modalidade: 'unidade' ou 'carteira' (carton). 'pacote' é tratado como carteira.
 */
function registrarVendaProduto(produtoId, quantidade = 1, modalidade = 'unidade') {
    const produto = getProduto(produtoId);
    if (!produto) return false;

    const totalDisponivel = getTotalUnidadesCigarro(produto);
    if (totalDisponivel <= 0) return false;

    if (modalidade === 'unidade') {
        const ok = sellCigaretteUnit(produto, quantidade);
        if (!ok) return false;
    } else if (modalidade === 'carteira' || modalidade === 'pacote') {
        const ok = sellCigaretteCarton(produto, quantidade);
        if (!ok) return false;
    } else {
        // Modalidades antigas como 'maco' são convertidas em unidades completas do maço
        const unidadesPorItem =
            modalidade === 'maco' ? CIGARRO_UNIDADES_POR_MACO : CIGARRO_UNIDADES_POR_CARTEIRA;
        const unidadesNecessarias = quantidade * unidadesPorItem;
        if (getTotalUnidadesCigarro(produto) < unidadesNecessarias) return false;
        // Consome diretamente em unidades usando lógica de unidade
        const ok = sellCigaretteUnit(produto, unidadesNecessarias);
        if (!ok) return false;
    }

    atualizarProduto(produto);
    return true;
}

function calcularEstatisticasEstoque() {
    const estoque = getEstoque();
    const totalUnidades = estoque.reduce((sum, p) => sum + getTotalUnidadesCigarro(p), 0);
    const valorTotal = estoque.reduce((sum, p) => sum + (getTotalUnidadesCigarro(p) * (p.valorVenda || 0)), 0);
    const custoTotal = estoque.reduce((sum, p) => {
        const un = getTotalUnidadesCigarro(p);
        const custoPorUn = (p.valorCustoCarteira || p.valorCusto || 0) / CIGARRO_UNIDADES_POR_MACO;
        return sum + un * custoPorUn;
    }, 0);

    return {
        marcas: estoque.length,
        unidades: totalUnidades,
        valor: valorTotal,
        custo: custoTotal,
        lucroPotencial: valorTotal - custoTotal
    };
}

function getProdutosEstoqueBaixo() {
    const minCig = p => (p.estoqueMinimo != null && p.estoqueMinimo !== '') ? p.estoqueMinimo : ESTOQUE_MINIMO_GLOBAL;
    const cigarros = getEstoque().filter(p => {
        const total = getTotalUnidadesCigarro(p);
        return total > 0 && total <= minCig(p);
    }).map(p => ({ ...p, quantidade: getTotalUnidadesCigarro(p), _secao: 'Cigarros' }));

    const minBeb = b => (b.estoqueMinimo != null && b.estoqueMinimo !== '') ? b.estoqueMinimo : ESTOQUE_MINIMO_GLOBAL;
    const bebidas = getBebidas().filter(b => {
        const totalUnidades = (b.quantidadeUnidades || 0) + (b.quantidadeCaixas || 0) * (b.unidadesPorCaixa || 24) + (b.quantidadePacotes || 0) * (b.unidadesPorPacote || 6);
        return totalUnidades > 0 && totalUnidades <= minBeb(b);
    }).map(b => ({
        ...b,
        marca: b.nome,
        tipo: b.categoria,
        quantidade: (b.quantidadeUnidades || 0) + (b.quantidadeCaixas || 0) * (b.unidadesPorCaixa || 24) + (b.quantidadePacotes || 0) * (b.unidadesPorPacote || 6),
        _secao: 'Bebidas'
    }));

    const minMer = i => (i.estoqueMinimo != null && i.estoqueMinimo !== '') ? i.estoqueMinimo : ESTOQUE_MINIMO_GLOBAL;
    const mercearia = getMercearia().filter(i => (i.quantidade || 0) > 0 && (i.quantidade || 0) <= minMer(i))
        .map(i => ({ ...i, marca: i.nome, tipo: i.categoria || 'Mercearia', _secao: 'Mercearia' }));

    return [...cigarros, ...bebidas, ...mercearia];
}

function calcularPrevisaoEstoque(produto, mediaVendas = 1) {
    if (mediaVendas <= 0) return Infinity;
    const total = produto.categoria === 'cigarro' ? getTotalUnidadesCigarro(produto) : (produto.quantidade || 0);
    return Math.floor(total / mediaVendas);
}

function getProdutoMaisVendido() {
    const estoque = getEstoque();
    if (estoque.length === 0) return null;
    return estoque.reduce((max, p) =>
        (p.vendasTotais || 0) > (max.vendasTotais || 0) ? p : max
    );
}

function getProdutoMaisLucrativo() {
    const estoque = getEstoque();
    if (estoque.length === 0) return null;
    return estoque.reduce((max, p) => {
        const lucroP = (p.vendasTotais || 0) * ((p.valorVenda || 0) - (p.valorCusto || 0));
        const lucroMax = (max.vendasTotais || 0) * ((max.valorVenda || 0) - (max.valorCusto || 0));
        return lucroP > lucroMax ? p : max;
    });
}

// ============================================
// OPERAÇÕES CRUD - BEBIDAS (CERVEJAS)
// ============================================

function getBebidas() {
    return JSON.parse(localStorage.getItem('cbp_bebidas') || '[]');
}

function setBebidas(bebidas) {
    localStorage.setItem('cbp_bebidas', JSON.stringify(bebidas));
}

function getBebida(id) {
    return getBebidas().find(b => b.id === id) || null;
}

function adicionarBebida(bebida) {
    const bebidas = getBebidas();
    const novaBebida = {
        id: bebidas.length > 0 ? Math.max(...bebidas.map(b => b.id)) + 1 : 1,
        dataCadastro: getDataHoraAtual(),
        vendasTotaisUnidades: 0,
        estoqueMinimo: bebida.estoqueMinimo != null ? bebida.estoqueMinimo : ESTOQUE_MINIMO_GLOBAL,
        unidadesPorCaixa: 24,
        unidadesPorPacote: bebida.unidadesPorPacote != null ? bebida.unidadesPorPacote : 0,
        quantidadeUnidades: 0,
        quantidadeCaixas: 0,
        quantidadePacotes: 0,
        valorVendaUnidade: 0,
        valorVendaCaixa: 0,
        valorVendaPacote: 0,
        valorCustoUnidade: 0,
        valorCustoCaixa: 0,
        ...bebida
    };
    bebidas.push(novaBebida);
    setBebidas(bebidas);

    adicionarHistorico({
        tipo: 'estoque',
        descricao: `Cadastro de bebida: ${bebida.nome}`,
        valor: 0,
        referencia: novaBebida.id.toString(),
        cliente: '-'
    });

    return novaBebida;
}

function atualizarBebida(bebida) {
    const bebidas = getBebidas();
    const index = bebidas.findIndex(b => b.id === bebida.id);
    if (index !== -1) {
        bebidas[index] = bebida;
        setBebidas(bebidas);
    }
}

/**
 * Registra venda de bebida
 * @param {number} bebidaId
 * @param {number} quantidade
 * @param {string} modalidade - 'unidade', 'caixa' (12/24 un) ou 'pacote' (6 un long neck)
 */
function registrarVendaBebida(bebidaId, quantidade = 1, modalidade = 'unidade') {
    const bebida = getBebida(bebidaId);
    if (!bebida) return false;

    const unPorCaixa = bebida.unidadesPorCaixa || 24;
    const unPorPacote = bebida.unidadesPorPacote || 0;
    const totalUn = () => (bebida.quantidadeUnidades || 0) + (bebida.quantidadeCaixas || 0) * unPorCaixa + (bebida.quantidadePacotes || 0) * unPorPacote;

    if (modalidade === 'caixa') {
        const unidadesNecessarias = quantidade * unPorCaixa;
        if (totalUn() < unidadesNecessarias) return false;
        let caixasAConsumir = Math.min(bebida.quantidadeCaixas || 0, quantidade);
        bebida.quantidadeCaixas -= caixasAConsumir;
        let restante = (quantidade - caixasAConsumir) * unPorCaixa;
        bebida.quantidadeUnidades = Math.max(0, (bebida.quantidadeUnidades || 0) - restante);
        bebida.vendasTotaisUnidades += unidadesNecessarias;
    } else if (modalidade === 'pacote' && unPorPacote > 0) {
        const unidadesNecessarias = quantidade * unPorPacote;
        if (totalUn() < unidadesNecessarias) return false;
        let pacotesAConsumir = Math.min(bebida.quantidadePacotes || 0, quantidade);
        bebida.quantidadePacotes -= pacotesAConsumir;
        let restante = (quantidade - pacotesAConsumir) * unPorPacote;
        bebida.quantidadeUnidades = Math.max(0, (bebida.quantidadeUnidades || 0) - restante);
        bebida.vendasTotaisUnidades += unidadesNecessarias;
    } else {
        // Venda por unidade: consome unidades soltas, depois pacotes, depois caixas
        const totalUnidades = totalUn();
        if (totalUnidades < quantidade) return false;
        let restante = quantidade;
        if ((bebida.quantidadeUnidades || 0) >= restante) {
            bebida.quantidadeUnidades -= restante;
        } else {
            restante -= (bebida.quantidadeUnidades || 0);
            bebida.quantidadeUnidades = 0;
            if (unPorPacote > 0 && (bebida.quantidadePacotes || 0) > 0 && restante > 0) {
                const pacotesAbrir = Math.min(bebida.quantidadePacotes, Math.ceil(restante / unPorPacote));
                bebida.quantidadePacotes -= pacotesAbrir;
                const consumidoPacotes = Math.min(restante, pacotesAbrir * unPorPacote);
                bebida.quantidadeUnidades += pacotesAbrir * unPorPacote - consumidoPacotes;
                restante -= consumidoPacotes;
            }
            if (restante > 0) {
                const caixasAbrir = Math.ceil(restante / unPorCaixa);
                bebida.quantidadeCaixas = Math.max(0, (bebida.quantidadeCaixas || 0) - caixasAbrir);
                bebida.quantidadeUnidades += caixasAbrir * unPorCaixa - restante;
            }
        }
        bebida.vendasTotaisUnidades += quantidade;
    }

    atualizarBebida(bebida);
    return true;
}

function devolverEstoqueBebida(bebidaId, quantidade, modalidade = 'unidade') {
    const bebida = getBebida(bebidaId);
    if (!bebida) return;
    const unPorCaixa = bebida.unidadesPorCaixa || 24;
    const unPorPacote = bebida.unidadesPorPacote || 6;

    if (modalidade === 'caixa') {
        bebida.quantidadeCaixas = (bebida.quantidadeCaixas || 0) + quantidade;
        bebida.vendasTotaisUnidades = Math.max(0, (bebida.vendasTotaisUnidades || 0) - quantidade * unPorCaixa);
    } else if (modalidade === 'pacote' && unPorPacote > 0) {
        bebida.quantidadePacotes = (bebida.quantidadePacotes || 0) + quantidade;
        bebida.vendasTotaisUnidades = Math.max(0, (bebida.vendasTotaisUnidades || 0) - quantidade * unPorPacote);
    } else {
        bebida.quantidadeUnidades = (bebida.quantidadeUnidades || 0) + quantidade;
        bebida.vendasTotaisUnidades = Math.max(0, (bebida.vendasTotaisUnidades || 0) - quantidade);
    }
    atualizarBebida(bebida);
}

function calcularEstatisticasBebidas() {
    const bebidas = getBebidas();
    let totalUnidades = 0;
    let valorTotal = 0;

    bebidas.forEach(b => {
        const unidades = (b.quantidadeUnidades || 0) + (b.quantidadeCaixas || 0) * (b.unidadesPorCaixa || 24);
        totalUnidades += unidades;
        valorTotal += unidades * (b.valorVendaUnidade || 0);
    });

    return { total: bebidas.length, unidades: totalUnidades, valor: valorTotal };
}

// ============================================
// OPERAÇÕES CRUD - MERCEARIA
// ============================================

function getMercearia() {
    return JSON.parse(localStorage.getItem('cbp_mercearia') || '[]');
}

/** Retorna listas de produtos existentes por categoria para uso no modal Nova Compra (apenas produtos já cadastrados). */
function getProdutosParaCompra() {
    return {
        cigarro: getEstoque(),
        bebida: getBebidas(),
        mercearia: getMercearia()
    };
}

function setMercearia(items) {
    localStorage.setItem('cbp_mercearia', JSON.stringify(items));
}

function getItemMercearia(id) {
    return getMercearia().find(i => i.id === id) || null;
}

function adicionarItemMercearia(item) {
    const lista = getMercearia();
    const novoItem = {
        id: lista.length > 0 ? Math.max(...lista.map(i => i.id)) + 1 : 1,
        dataCadastro: getDataHoraAtual(),
        vendasTotais: 0,
        estoqueMinimo: item.estoqueMinimo != null ? item.estoqueMinimo : ESTOQUE_MINIMO_GLOBAL,
        ...item
    };
    lista.push(novoItem);
    setMercearia(lista);

    adicionarHistorico({
        tipo: 'estoque',
        descricao: `Cadastro mercearia: ${item.nome} (${item.categoria || 'geral'})`,
        valor: 0,
        referencia: novoItem.id.toString(),
        cliente: '-'
    });

    return novoItem;
}

function atualizarItemMercearia(item) {
    const lista = getMercearia();
    const idx = lista.findIndex(i => i.id === item.id);
    if (idx !== -1) { lista[idx] = item; setMercearia(lista); }
}

function excluirItemMercearia(id) {
    const lista = getMercearia().filter(i => i.id !== id);
    setMercearia(lista);
    adicionarHistorico({ tipo: 'estoque', descricao: `Exclusão item mercearia #${id}`, valor: 0, referencia: id.toString(), cliente: '-' });
    return true;
}

function calcularEstatisticasMercearia() {
    const lista = getMercearia();
    return {
        total: lista.length,
        unidades: lista.reduce((s, i) => s + (i.quantidade || 0), 0),
        valor: lista.reduce((s, i) => s + ((i.quantidade || 0) * (i.valorVenda || 0)), 0)
    };
}

function registrarVendaMercearia(itemId, quantidade = 1) {
    const item = getItemMercearia(itemId);
    if (item && (item.quantidade || 0) >= quantidade) {
        item.quantidade -= quantidade;
        item.vendasTotais = (item.vendasTotais || 0) + quantidade;
        atualizarItemMercearia(item);
        return true;
    }
    return false;
}

// ============================================
// EXCLUSÃO DE PRODUTOS (CIGARROS E BEBIDAS)
// ============================================

function excluirProduto(id) {
    const estoque = getEstoque().filter(p => p.id !== id);
    setEstoque(estoque);
    adicionarHistorico({ tipo: 'estoque', descricao: `Exclusão produto cigarro #${id}`, valor: 0, referencia: id.toString(), cliente: '-' });
    return true;
}

function excluirBebida(id) {
    const bebidas = getBebidas().filter(b => b.id !== id);
    setBebidas(bebidas);
    adicionarHistorico({ tipo: 'estoque', descricao: `Exclusão bebida #${id}`, valor: 0, referencia: id.toString(), cliente: '-' });
    return true;
}

// ============================================
// OPERAÇÕES CRUD - CAIXA
// ============================================

function getCaixa() {
    return JSON.parse(localStorage.getItem('cbp_caixa') || '{}');
}

function setCaixa(caixa) {
    localStorage.setItem('cbp_caixa', JSON.stringify(caixa));
}

function abrirCaixa(valorInicial) {
    const caixa = getCaixa();
    if (!caixa.aberto) {
        caixa.aberto = true;
        caixa.dataAbertura = getDataHoraAtual();
        caixa.valorInicial = valorInicial;
        caixa.vendas = [];
        caixa.movimentacoes = [];
        setCaixa(caixa);

        adicionarHistorico({
            tipo: 'caixa',
            descricao: `Abertura de caixa`,
            valor: valorInicial,
            referencia: '-',
            cliente: '-'
        });

        return true;
    }
    return false;
}

function fecharCaixa() {
    const caixa = getCaixa();
    if (caixa.aberto) {
        const vendasCaixa = getVendas().filter(v => caixa.vendas.includes(v.id) && !v.cancelada);

        const totais = { dinheiro: 0, debito: 0, credito: 0, pix: 0, fiado: 0 };
        vendasCaixa.forEach(v => {
            if (totais[v.formaPagamento] !== undefined) {
                totais[v.formaPagamento] += v.valor;
            }
        });

        const entradas = caixa.movimentacoes.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
        const retiradas = caixa.movimentacoes.filter(m => m.tipo === 'retirada').reduce((sum, m) => sum + m.valor, 0);
        const receitaVendasCaixa = vendasCaixa.filter(v => v.formaPagamento !== 'fiado').reduce((sum, v) => sum + v.valor, 0);
        const pagamentosHoje = getPagamentosFiadoHoje();
        const totalVendido = receitaVendasCaixa + pagamentosHoje;
        const valorFinal = caixa.valorInicial + totalVendido + entradas - retiradas;
        totais.fiado = getFiadoVendasHoje();

        const relatorio = {
            dataAbertura: caixa.dataAbertura,
            dataFechamento: getDataHoraAtual(),
            valorInicial: caixa.valorInicial,
            totalVendido,
            totaisPorPagamento: totais,
            entradas,
            retiradas,
            valorFinal,
            quantidadeVendas: vendasCaixa.length
        };

        caixa.aberto = false;
        caixa.dataAbertura = null;
        caixa.valorInicial = 0;
        caixa.vendas = [];
        caixa.movimentacoes = [];
        setCaixa(caixa);

        adicionarHistorico({
            tipo: 'caixa',
            descricao: `Fechamento de caixa`,
            valor: valorFinal,
            referencia: '-',
            cliente: '-'
        });

        return relatorio;
    }
    return null;
}

function adicionarMovimentacao(tipo, valor, descricao) {
    const caixa = getCaixa();
    if (caixa.aberto && valor > 0) {
        caixa.movimentacoes.push({
            id: gerarId(),
            data: getDataHoraAtual(),
            tipo,
            valor,
            descricao
        });
        setCaixa(caixa);

        adicionarHistorico({
            tipo: 'caixa',
            descricao: `${tipo === 'entrada' ? 'Entrada' : 'Retirada'}: ${descricao}`,
            valor: tipo === 'entrada' ? valor : -valor,
            referencia: '-',
            cliente: '-'
        });

        return true;
    }
    return false;
}

// ============================================
// OPERAÇÕES CRUD - FORNECEDORES
// ============================================

function getFornecedores() {
    return JSON.parse(localStorage.getItem('cbp_fornecedores') || '[]');
}

function setFornecedores(fornecedores) {
    localStorage.setItem('cbp_fornecedores', JSON.stringify(fornecedores));
}

/**
 * Adiciona fornecedor E integra automaticamente ao estoque correto.
 * @param {Object} fornecedor
 * @param {string} fornecedor.categoriaEstoque - 'cigarro' | 'bebida' | 'mercearia'
 * @param {string} fornecedor.nomeProduto
 * @param {number} fornecedor.quantidade
 * @param {number} fornecedor.valorUnitario  - custo unitário pago ao fornecedor
 */
function adicionarFornecedor(fornecedor) {
    const fornecedores = getFornecedores();
    const novoFornecedor = {
        id: gerarId(),
        dataCadastro: getDataHoraAtual(),
        ...fornecedor
    };
    fornecedores.push(novoFornecedor);
    setFornecedores(fornecedores);

    // ── Integração com estoque ──────────────────────────────
    const cat = (fornecedor.categoriaEstoque || 'mercearia').toLowerCase();
    const qtd = parseInt(fornecedor.quantidade) || 0;
    const custo = parseFloat(fornecedor.valorUnitario) || 0;
    const venda = parseFloat(fornecedor.valorVendaUnit) || 0;

    if (cat === 'cigarro') {
        // Entrada rápida de fornecedor para cigarro:
        // quantidade é sempre em MAÇOS (packs), sem conversão automática.
        const estoque = getEstoque();
        const nomeLower = (fornecedor.nomeProduto || '').toLowerCase();
        let prod = estoque.find(p =>
            (`${p.marca} ${p.tipo}`).toLowerCase() === nomeLower ||
            p.tipo.toLowerCase() === nomeLower ||
            p.marca.toLowerCase() === nomeLower
        );
        if (prod) {
            prod.quantidadeMacos = (prod.quantidadeMacos || 0) + qtd;
            if (custo > 0) prod.valorCustoCarteira = custo; // custo por maço
            if (venda > 0) prod.valorVenda = venda;
            atualizarProduto(prod);
        } else {
            adicionarProduto({
                marca: fornecedor.nomeProduto,
                tipo: 'Novo',
                quantidadeMacos: qtd,
                quantidadeCarteiras: 0,
                quantidade: 0,
                valorVenda: venda,
                valorCustoCarteira: custo
            });
        }

    } else if (cat === 'bebida') {
        const bebidas = getBebidas();
        const nomeLower = (fornecedor.nomeProduto || '').toLowerCase();
        let beb = bebidas.find(b => b.nome.toLowerCase() === nomeLower);
        if (beb) {
            beb.quantidadeUnidades = (beb.quantidadeUnidades || 0) + qtd;
            if (custo > 0) beb.valorCustoUnidade = custo;
            if (venda > 0) { beb.valorVendaUnidade = venda; beb.valorVendaCaixa = venda * (beb.unidadesPorCaixa || 24); }
            atualizarBebida(beb);
        } else {
            adicionarBebida({
                nome: fornecedor.nomeProduto,
                categoria: fornecedor.tipoProduto || 'bebida',
                unidadesPorCaixa: 24,
                quantidadeUnidades: qtd,
                quantidadeCaixas: 0,
                valorVendaUnidade: venda,
                valorVendaCaixa: venda * 24,
                valorCustoUnidade: custo,
                valorCustoCaixa: custo * 24
            });
        }

    } else {
        const lista = getMercearia();
        const nomeLower = (fornecedor.nomeProduto || '').toLowerCase();
        let item = lista.find(i => i.nome.toLowerCase() === nomeLower);
        if (item) {
            item.quantidade = (item.quantidade || 0) + qtd;
            if (custo > 0) item.valorCusto = custo;
            if (venda > 0) item.valorVenda = venda;
            atualizarItemMercearia(item);
        } else {
            adicionarItemMercearia({
                nome: fornecedor.nomeProduto,
                categoria: fornecedor.tipoProduto || 'geral',
                quantidade: qtd,
                valorVenda: venda,
                valorCusto: custo,
                estoqueMinimo: 5
            });
        }
    }
    // ───────────────────────────────────────────────────────

    adicionarHistorico({
        tipo: 'fornecedor',
        descricao: `Compra de ${fornecedor.nomeProduto} - ${fornecedor.nome} → estoque (${cat})`,
        valor: qtd * custo,
        referencia: novoFornecedor.id,
        cliente: '-'
    });

    return novoFornecedor;
}

function getFornecedor(id) {
    return getFornecedores().find(f => f.id === id) || null;
}

function atualizarFornecedor(fornecedor) {
    const lista = getFornecedores();
    const idx = lista.findIndex(f => f.id === fornecedor.id);
    if (idx !== -1) {
        // Ajusta a diferença de quantidade no estoque
        const antigo = lista[idx];
        const diffQtd = (parseInt(fornecedor.quantidade) || 0) - (parseInt(antigo.quantidade) || 0);
        if (diffQtd !== 0) {
            _ajustarEstoqueFornecedor(fornecedor.categoriaEstoque, fornecedor.nomeProduto, diffQtd, parseFloat(fornecedor.valorUnitario) || 0, parseFloat(fornecedor.valorVendaUnit) || 0);
        } else if (fornecedor.valorVendaUnit > 0 || fornecedor.valorUnitario > 0) {
            // Sem diff de qtd mas preços mudaram — atualiza preços no estoque
            _ajustarEstoqueFornecedor(fornecedor.categoriaEstoque, fornecedor.nomeProduto, 0, parseFloat(fornecedor.valorUnitario) || 0, parseFloat(fornecedor.valorVendaUnit) || 0);
        }
        lista[idx] = { ...antigo, ...fornecedor };
        setFornecedores(lista);
        adicionarHistorico({
            tipo: 'fornecedor',
            descricao: `Edição de fornecedor: ${fornecedor.nomeProduto} (diff: ${diffQtd > 0 ? '+' : ''}${diffQtd})`,
            valor: 0,
            referencia: fornecedor.id,
            cliente: '-'
        });
    }
}

function excluirFornecedor(id) {
    const f = getFornecedor(id);
    if (!f) return false;
    // Reverte a entrada no estoque
    _ajustarEstoqueFornecedor(f.categoriaEstoque, f.nomeProduto, -(parseInt(f.quantidade) || 0), 0);
    const lista = getFornecedores().filter(x => x.id !== id);
    setFornecedores(lista);
    adicionarHistorico({
        tipo: 'fornecedor',
        descricao: `Exclusão fornecedor: ${f.nomeProduto} — estoque revertido`,
        valor: 0,
        referencia: id,
        cliente: '-'
    });
    return true;
}

// ============================================
// CADASTRO DE FORNECEDORES (nome, contato, notas) + COMPRAS
// ============================================

function getSuppliers() {
    return JSON.parse(localStorage.getItem('cbp_suppliers') || '[]');
}

function setSuppliers(list) {
    localStorage.setItem('cbp_suppliers', JSON.stringify(list));
}

function getSupplier(id) {
    return getSuppliers().find(s => s.id === id) || null;
}

function addSupplier(supplier) {
    const list = getSuppliers();
    const novo = {
        id: gerarId(),
        nome: supplier.nome || '',
        contato: supplier.contato || '',
        notas: supplier.notas || '',
        dataCadastro: getDataHoraAtual()
    };
    list.push(novo);
    setSuppliers(list);
    return novo;
}

function getCompras() {
    return JSON.parse(localStorage.getItem('cbp_compras') || '[]');
}

function setCompras(list) {
    localStorage.setItem('cbp_compras', JSON.stringify(list));
}

function getCompra(id) {
    return getCompras().find(c => c.id === id) || null;
}

/**
 * Registra compra de um fornecedor e aumenta estoque.
 * compra: { fornecedorId, itens: [{ tipo: 'cigarro'|'bebida'|'mercearia', produtoId ou nomeProduto, quantidade, custoUnitario }], pago?: boolean }
 */
function addCompra(compra) {
    const compras = getCompras();
    const total = (compra.itens || []).reduce((s, i) => s + (i.quantidade || 0) * (i.custoUnitario || 0), 0);
    const nova = {
        id: gerarId(),
        fornecedorId: compra.fornecedorId,
        data: getDataHoraAtual(),
        dataCurta: getDataAtual(),
        itens: compra.itens || [],
        total: total,
        pago: compra.pago === true
    };
    compras.push(nova);
    setCompras(compras);

    // Compra só aumenta estoque de produtos JÁ cadastrados (produtoId obrigatório).
    (nova.itens || []).forEach(item => {
        const tipo = (item.tipo || 'mercearia').toLowerCase();
        const qtd = parseInt(item.quantidade) || 0;
        const custo = parseFloat(item.custoUnitario) || 0;
        const produtoId = item.produtoId != null ? Number(item.produtoId) : null;
        if (produtoId == null || produtoId <= 0 || qtd <= 0) return;

        if (tipo === 'cigarro') {
            // Compras de cigarro entram SEMPRE em maços (packs),
            // sem conversão automática para carteiras/unidades.
            const p = getProduto(produtoId);
            if (p) {
                p.quantidadeMacos = (p.quantidadeMacos || 0) + qtd;
                if (custo > 0) p.valorCustoCarteira = custo; // aqui custo por maço
                if (item.valorVenda != null) p.valorVenda = item.valorVenda;
                atualizarProduto(p);
            }
        } else if (tipo === 'bebida') {
            const b = getBebida(produtoId);
            if (b) {
                b.quantidadeCaixas = (b.quantidadeCaixas || 0) + qtd;
                if (custo > 0) b.valorCustoUnidade = custo;
                atualizarBebida(b);
            }
        } else if (tipo === 'mercearia') {
            const m = getItemMercearia(produtoId);
            if (m) {
                m.quantidade = (m.quantidade || 0) + qtd;
                if (custo > 0) m.valorCusto = custo;
                atualizarItemMercearia(m);
            }
        }
    });

    adicionarHistorico({
        tipo: 'fornecedor',
        descricao: `Compra registrada - ${(getSupplier(compra.fornecedorId) || {}).nome || compra.fornecedorId}`,
        valor: total,
        referencia: nova.id,
        cliente: '-'
    });
    return nova;
}

function _aumentarEstoquePorNome(tipo, nomeProduto, qtd, custo, valorVenda, modalidade) {
    const nome = nomeProduto.toLowerCase();
    if (tipo === 'cigarro') {
        const estoque = getEstoque();
        const p = estoque.find(x => (`${x.marca} ${x.tipo}`).toLowerCase() === nome || x.marca.toLowerCase() === nome);
        if (p) {
            p.quantidade = (p.quantidade || 0) + qtd;
            if (custo > 0) p.valorCusto = custo;
            if (valorVenda != null) p.valorVenda = valorVenda;
            atualizarProduto(p);
        } else {
            adicionarProduto({ marca: nomeProduto, tipo: 'Novo', quantidade: qtd, valorCusto: custo, valorVenda: valorVenda || 0 });
        }
    } else if (tipo === 'bebida') {
        const bebidas = getBebidas();
        const b = bebidas.find(x => x.nome.toLowerCase() === nome);
        if (b) {
            if (modalidade === 'caixa') b.quantidadeCaixas = (b.quantidadeCaixas || 0) + qtd;
            else if (modalidade === 'pacote' && (b.unidadesPorPacote || 0) > 0) b.quantidadePacotes = (b.quantidadePacotes || 0) + qtd;
            else b.quantidadeUnidades = (b.quantidadeUnidades || 0) + qtd;
            if (custo > 0) b.valorCustoUnidade = custo;
            atualizarBebida(b);
        } else {
            adicionarBebida({ nome: nomeProduto, categoria: 'bebida', quantidadeUnidades: qtd, valorCustoUnidade: custo, valorVendaUnidade: valorVenda || 0 });
        }
    } else {
        const lista = getMercearia();
        const m = lista.find(x => x.nome.toLowerCase() === nome);
        if (m) {
            m.quantidade = (m.quantidade || 0) + qtd;
            if (custo > 0) m.valorCusto = custo;
            if (valorVenda != null) m.valorVenda = valorVenda;
            atualizarItemMercearia(m);
        } else {
            adicionarItemMercearia({ nome: nomeProduto, categoria: 'geral', quantidade: qtd, valorCusto: custo, valorVenda: valorVenda || 0 });
        }
    }
}

function getComprasPorFornecedor(fornecedorId) {
    return getCompras().filter(c => c.fornecedorId === fornecedorId).sort((a, b) => new Date(b.data) - new Date(a.data));
}

function getTotalComprasFornecedor(fornecedorId) {
    return getComprasPorFornecedor(fornecedorId).reduce((s, c) => s + (c.total || 0), 0);
}

function marcarCompraPaga(compraId, pago) {
    const compras = getCompras();
    const c = compras.find(x => x.id === compraId);
    if (c) {
        c.pago = !!pago;
        setCompras(compras);
        return true;
    }
    return false;
}

/** Ajusta (soma ou subtrai) quantidade no estoque correto */
function _ajustarEstoqueFornecedor(cat, nomeProduto, diffQtd, custo, venda = 0) {
    const c = (cat || 'mercearia').toLowerCase();
    const nomeLower = (nomeProduto || '').toLowerCase();

    if (c === 'cigarro') {
        const estoque = getEstoque();
        const prod = estoque.find(p =>
            (`${p.marca} ${p.tipo}`).toLowerCase() === nomeLower ||
            p.tipo.toLowerCase() === nomeLower ||
            p.marca.toLowerCase() === nomeLower
        );
        if (prod) {
            // Ajuste sempre em maços (packs) para cigarro
            prod.quantidadeMacos = Math.max(0, (prod.quantidadeMacos || 0) + diffQtd);
            if (custo > 0) prod.valorCustoCarteira = custo; // custo por maço
            if (venda > 0) prod.valorVenda = venda;
            atualizarProduto(prod);
        }
    } else if (c === 'bebida') {
        const beb = getBebidas().find(b => b.nome.toLowerCase() === nomeLower);
        if (beb) {
            beb.quantidadeUnidades = Math.max(0, (beb.quantidadeUnidades || 0) + diffQtd);
            if (custo > 0) beb.valorCustoUnidade = custo;
            if (venda > 0) { beb.valorVendaUnidade = venda; beb.valorVendaCaixa = venda * (beb.unidadesPorCaixa || 24); }
            atualizarBebida(beb);
        }
    } else {
        const item = getMercearia().find(i => i.nome.toLowerCase() === nomeLower);
        if (item) {
            item.quantidade = Math.max(0, (item.quantidade || 0) + diffQtd);
            if (custo > 0) item.valorCusto = custo;
            if (venda > 0) item.valorVenda = venda;
            atualizarItemMercearia(item);
        }
    }
}

function getHistorico() {
    return JSON.parse(localStorage.getItem('cbp_historico') || '[]');
}

function setHistorico(historico) {
    localStorage.setItem('cbp_historico', JSON.stringify(historico));
}

function adicionarHistorico(registro) {
    const historico = getHistorico();
    historico.push({
        id: gerarId(),
        data: getDataHoraAtual(),
        dataCurta: getDataAtual(),
        ...registro
    });
    setHistorico(historico);
}

function filtrarHistorico(dataInicio, dataFim, tipo = 'todos') {
    let historico = getHistorico();

    if (dataInicio) historico = historico.filter(h => h.dataCurta >= dataInicio);
    if (dataFim) historico = historico.filter(h => h.dataCurta <= dataFim);
    if (tipo && tipo !== 'todos') historico = historico.filter(h => h.tipo === tipo);

    return historico.sort((a, b) => new Date(b.data) - new Date(a.data));
}

// ============================================
// BACKUP E RESTAURAÇÃO
// ============================================

// Monta o payload completo de backup com todas as coleções relevantes.
function _coletarDadosBackup() {
    return {
        sales: getVendas(),
        stock: getEstoque(),
        bebidas: getBebidas(),
        mercearia: getMercearia(),
        fiadoCustomers: getClientes(),
        suppliers: getSuppliers(),
        purchaseHistory: getCompras(),
        operators: getOperadores(),
        operadorAtivo: getOperadorAtivo(),
        caixa: getCaixa(),
        fornecedoresLegacy: getFornecedores(),
        historico: getHistorico(),
        settings: JSON.parse(localStorage.getItem('cbp_settings') || '{}'),
        shiftHistory: JSON.parse(localStorage.getItem('cbp_shift_history') || '[]'),
        dataExportacao: getDataHoraAtual()
    };
}

/**
 * Exporta todos os dados do sistema em formato JSON para backup manual.
 */
function exportBackup() {
    const dados = _coletarDadosBackup();
    return JSON.stringify(dados, null, 2);
}

/**
 * Importa um backup completo, substituindo os dados atuais.
 * Aceita string JSON ou objeto já parseado.
 */
function importBackup(jsonOuObjeto) {
    try {
        const dados = typeof jsonOuObjeto === 'string' ? JSON.parse(jsonOuObjeto) : jsonOuObjeto;

        if (dados.sales) localStorage.setItem('cbp_vendas', JSON.stringify(dados.sales));
        if (dados.fiadoCustomers) localStorage.setItem('cbp_clientes', JSON.stringify(dados.fiadoCustomers));
        if (dados.stock) localStorage.setItem('cbp_estoque', JSON.stringify(dados.stock));
        if (dados.bebidas) localStorage.setItem('cbp_bebidas', JSON.stringify(dados.bebidas));
        if (dados.mercearia) localStorage.setItem('cbp_mercearia', JSON.stringify(dados.mercearia));
        if (dados.caixa) localStorage.setItem('cbp_caixa', JSON.stringify(dados.caixa));
        if (dados.fornecedoresLegacy) localStorage.setItem('cbp_fornecedores', JSON.stringify(dados.fornecedoresLegacy));
        if (dados.suppliers) localStorage.setItem('cbp_suppliers', JSON.stringify(dados.suppliers));
        if (dados.suppliers && !dados.purchaseHistory) {
            // compatibilidade antiga
        }
        if (dados.purchaseHistory) localStorage.setItem('cbp_compras', JSON.stringify(dados.purchaseHistory));
        if (dados.historico) localStorage.setItem('cbp_historico', JSON.stringify(dados.historico));
        if (dados.operators) localStorage.setItem('cbp_operadores', JSON.stringify(dados.operators));
        if (dados.operadorAtivo !== undefined) localStorage.setItem('cbp_operador_ativo', JSON.stringify(dados.operadorAtivo));
        if (dados.settings) localStorage.setItem('cbp_settings', JSON.stringify(dados.settings));
        if (dados.shiftHistory) localStorage.setItem('cbp_shift_history', JSON.stringify(dados.shiftHistory));

        return true;
    } catch (e) {
        console.error('Erro ao importar backup:', e);
        return false;
    }
}

/**
 * Cria um backup automático diário, armazenando no próprio localStorage.
 * Mantém apenas os 7 backups mais recentes.
 */
function createAutoBackup() {
    const payload = _coletarDadosBackup();
    const registro = {
        criadoEm: getDataHoraAtual(),
        dados: payload
    };

    const prefix = 'cbp_auto_backup_';
    // Descobre índices existentes
    const chaves = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
            const idx = parseInt(k.replace(prefix, ''), 10);
            if (!isNaN(idx)) chaves.push({ chave: k, idx });
        }
    }
    chaves.sort((a, b) => a.idx - b.idx);

    // Próximo índice
    const proximoIdx = chaves.length ? chaves[chaves.length - 1].idx + 1 : 1;
    const chaveNova = prefix + proximoIdx;
    localStorage.setItem(chaveNova, JSON.stringify(registro));

    // Mantém apenas os 7 mais recentes
    if (chaves.length + 1 > 7) {
        const qtdRemover = chaves.length + 1 - 7;
        for (let i = 0; i < qtdRemover; i++) {
            localStorage.removeItem(chaves[i].chave);
        }
    }
}

function limparTodosDados() {
    ['cbp_vendas', 'cbp_clientes', 'cbp_estoque', 'cbp_bebidas',
     'cbp_caixa', 'cbp_fornecedores', 'cbp_suppliers', 'cbp_compras',
     'cbp_historico', 'cbp_inicializado'
    ].forEach(key => localStorage.removeItem(key));
}

// Inicializa o sistema quando o script é carregado
inicializarSistema();
