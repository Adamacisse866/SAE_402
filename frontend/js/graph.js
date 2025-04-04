class Graph {
    constructor(containerSelector, onNodeClick) {
        this.container = d3.select(containerSelector);
        this.onNodeClick = onNodeClick;
        
        // Obtenir les dimensions du conteneur
        const containerWidth = this.container.node().clientWidth;
        const containerHeight = this.container.node().clientHeight;
        
        // Créer le SVG avec les dimensions du conteneur
        this.svg = this.container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', [0, 0, containerWidth, containerHeight])
            .style('background-color', 'transparent');
        
        // Configuration de la simulation de force
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2))
            .force('collision', d3.forceCollide().radius(30));
    }

    update(data) {
        // Nettoyage du SVG
        this.svg.selectAll('*').remove();

        // Création des liens
        const links = this.svg.append('g')
            .selectAll('line')
            .data(data.links)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1);

        // Création des nœuds
        const nodes = this.svg.append('g')
            .selectAll('g')
            .data(data.nodes)
            .enter()
            .append('g')
            .call(d3.drag()
                .on('start', this.dragstarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragended.bind(this)));

        // Ajout des cercles pour les nœuds
        nodes.append('circle')
            .attr('r', d => d.type === 'movie' ? 20 : 15)
            .attr('fill', d => {
                if (d.hidden) return '#fff';
                return d.type === 'movie' ? '#ff6b6b' : '#4ecdc4';
            })
            .attr('stroke', d => {
                if (d.hidden) return '#2196F3';
                return d.type === 'movie' ? '#ff5252' : '#45b7af';
            })
            .attr('stroke-width', 2)
            .style('cursor', d => d.hidden ? 'pointer' : 'default')
            .style('transition', 'all 0.3s ease')
            .on('mouseover', function(event, d) {
                if (d.hidden) {
                    d3.select(this)
                        .attr('r', d => d.type === 'movie' ? 25 : 20)
                        .attr('fill', '#2196F3')
                        .attr('stroke', '#1976D2');
                }
            })
            .on('mouseout', function(event, d) {
                if (d.hidden) {
                    d3.select(this)
                        .attr('r', d => d.type === 'movie' ? 20 : 15)
                        .attr('fill', '#fff')
                        .attr('stroke', '#2196F3');
                }
            });

        // Ajout des textes pour les nœuds
        nodes.append('text')
            .attr('dy', 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#333')
            .text(d => {
                if (d.hidden) return '?';
                return d.type === 'movie' ? d.data.title : d.data.name;
            })
            .style('font-size', '12px')
            .style('pointer-events', 'none');

        // Ajout des tooltips
        nodes.append('title')
            .text(d => {
                if (d.hidden) return 'Cliquez pour deviner';
                return d.type === 'movie' ? d.data.title : d.data.name;
            });

        // Gestion des clics sur les nœuds
        nodes.on('click', (event, d) => {
            if (this.onNodeClick && d.hidden) {
                this.onNodeClick(d);
            }
        });

        // Mise à jour de la simulation
        this.simulation
            .nodes(data.nodes)
            .on('tick', () => {
                links
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);

                nodes
                    .attr('transform', d => `translate(${d.x},${d.y})`);
            });

        this.simulation.force('link')
            .links(data.links);

        // Démarrer la simulation
        this.simulation.alpha(1).restart();
    }

    revealActor(actorId) {
        const node = this.svg.selectAll('g')
            .filter(d => d.id === actorId);
        
        node.select('circle')
            .attr('fill', '#4CAF50')  // Vert pour les nœuds trouvés
            .attr('stroke', '#388E3C');

        node.select('text')
            .text(d => d.type === 'movie' ? d.data.title : d.data.name);
    }

    dragstarted(event) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    dragended(event) {
        if (!event.active) this.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
} 