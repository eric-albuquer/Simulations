        class Espaco3D {
            constructor(x, y, z) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
        }

        class Ponto3D {
            constructor(x, y, z, visivel = false) {
                this.posicao = new Espaco3D(x, y, z);
                this.visivel = visivel;
            }

            atualizar(x, y, z) {
                this.posicao.x = x;
                this.posicao.y = y;
                this.posicao.z = z;
            }
        }

        class Cubo {
            constructor(x, y, z, tamanho) {
                this.tamanho = tamanho;
                this.center = new Ponto3D(x, y, z, false);
                this.v1 = new Ponto3D(x - tamanho / 2, y - tamanho / 2, z - tamanho / 2, true);
                this.v2 = new Ponto3D(x + tamanho / 2, y - tamanho / 2, z - tamanho / 2, true);
                this.v3 = new Ponto3D(x - tamanho / 2, y + tamanho / 2, z - tamanho / 2, true);
                this.v4 = new Ponto3D(x + tamanho / 2, y + tamanho / 2, z - tamanho / 2, true);
                this.v5 = new Ponto3D(x - tamanho / 2, y - tamanho / 2, z + tamanho / 2, true);
                this.v6 = new Ponto3D(x + tamanho / 2, y - tamanho / 2, z + tamanho / 2, true);
                this.v7 = new Ponto3D(x - tamanho / 2, y + tamanho / 2, z + tamanho / 2, true);
                this.v8 = new Ponto3D(x + tamanho / 2, y + tamanho / 2, z + tamanho / 2, true);
            }

            moverAbsoluto(x, y, z) {
                const halfSize = this.tamanho / 2;
                this.center.atualizar(x, y, z);
                this.v1.atualizar(x - halfSize, y - halfSize, z - halfSize);
                this.v2.atualizar(x + halfSize, y - halfSize, z - halfSize);
                this.v3.atualizar(x - halfSize, y + halfSize, z - halfSize);
                this.v4.atualizar(x + halfSize, y + halfSize, z - halfSize);
                this.v5.atualizar(x - halfSize, y - halfSize, z + halfSize);
                this.v6.atualizar(x + halfSize, y - halfSize, z + halfSize);
                this.v7.atualizar(x - halfSize, y + halfSize, z + halfSize);
                this.v8.atualizar(x + halfSize, y + halfSize, z + halfSize);
            }

            moverRelativo(x, y, z) {
                const a = this.center.posicao.x + x;
                const b = this.center.posicao.y + y;
                const c = this.center.posicao.z + z;
                this.moverAbsoluto(a, b, c);
            }

            mostrarCordenadas() {
                console.log("Coordinates of the Cube Vertices:");
                console.log("V1:", this.v1.posicao, this.v1.visivel);
                console.log("V2:", this.v2.posicao, this.v2.visivel);
                console.log("V3:", this.v3.posicao, this.v3.visivel);
                console.log("V4:", this.v4.posicao, this.v4.visivel);
                console.log("V5:", this.v5.posicao, this.v5.visivel);
                console.log("V6:", this.v6.posicao, this.v6.visivel);
                console.log("V7:", this.v7.posicao, this.v7.visivel);
                console.log("V8:", this.v8.posicao, this.v8.visivel);

                console.log("Center:", this.center.posicao, this.center.visivel);
            }
        }

        class PrismaTriangular {
            constructor(x, y, z, altura, larguraBase, comprimentoBase) {
                this.altura = altura;
                this.larguraBase = larguraBase;
                this.comprimentoBase = comprimentoBase;

                this.v1 = new Ponto3D(x, y, z, true);
                this.v2 = new Ponto3D(x + larguraBase, y, z, true);
                this.v3 = new Ponto3D(x, y + comprimentoBase, z, true);
                this.v4 = new Ponto3D(x + larguraBase, y + comprimentoBase, z, true);

                this.v5 = new Ponto3D(x + larguraBase / 2, y + comprimentoBase / 2, z + altura, true);
            }

            moverAbsoluto(x, y, z) {
                this.v1.atualizar(x, y, z);
                this.v2.atualizar(x + this.larguraBase, y, z);
                this.v3.atualizar(x, y + this.comprimentoBase, z);
                this.v4.atualizar(x + this.larguraBase, y + this.comprimentoBase, z);

                this.v5.atualizar(x + this.larguraBase / 2, y + this.comprimentoBase / 2, z + this.altura);
            }

            moverRelativo(x, y, z) {
                const a = this.v1.posicao.x + x;
                const b = this.v1.posicao.y + y;
                const c = this.v1.posicao.z + z;
                this.moverAbsoluto(a, b, c);
            }

            mostrarCordenadas() {
                console.log("Coordinates of the Triangular Prism Vertices:");
                console.log("V1:", this.v1.posicao, this.v1.visivel);
                console.log("V2:", this.v2.posicao, this.v2.visivel);
                console.log("V3:", this.v3.posicao, this.v3.visivel);
                console.log("V4:", this.v4.posicao, this.v4.visivel);
                console.log("V5:", this.v5.posicao, this.v5.visivel);
            }
        }

        class Projecao {
            constructor(anguloX, anguloY, cameraX, cameraY, cameraZ, resolucaoX, resolucaoY) {
                this.anguloX = anguloX;
                this.anguloY = anguloY;
                this.matrix = [];
                this.cameraPosicao = new Espaco3D(cameraX, cameraY, cameraZ);
                this.initializeMatrix(resolucaoX, resolucaoY);
            }

            initializeMatrix(resolucaoX, resolucaoY) {
                // Initialize the 2D matrix with empty spaces
                for (let i = 0; i < resolucaoY; i++) {
                    this.matrix[i] = [];
                    for (let j = 0; j < resolucaoX; j++) {
                        this.matrix[i][j] = '.';
                    }
                }
            }

            projetarPonto(posicao) {
                const relX = posicao.x - this.cameraPosicao.x;
                const relY = posicao.y - this.cameraPosicao.y;
                const relZ = posicao.z - this.cameraPosicao.z;

                const centroX = this.matrix[0].length / 2;
                const centroY = this.matrix.length / 2;

                const rotatedX = relX * Math.cos(this.anguloY) - relZ * Math.sin(this.anguloY);
                const rotatedZ = relX * Math.sin(this.anguloY) + relZ * Math.cos(this.anguloY);

                const x = Math.round(rotatedX + centroX);
                const y = Math.min(Math.max(Math.round(relY * Math.cos(this.anguloX) - rotatedZ * Math.sin(this.anguloX) + centroY), 0), this.matrix.length - 1);
                const z = Math.min(Math.max(Math.round(relY * Math.sin(this.anguloX) + rotatedZ * Math.cos(this.anguloX)), 0), this.matrix[0].length - 1);

                return { x, y, z };
            }

            mostrarProjecao() {
                console.log("Orthogonal Projection:");
                for (let i = 0; i < this.matrix.length; i++) {
                    console.log(this.matrix[i].join('.'));
                }
            }

            projetarPrismaTriangular(prisma) {
                this.adicionarLinha(prisma.v1, prisma.v2);
                this.adicionarLinha(prisma.v3, prisma.v1);
                this.adicionarLinha(prisma.v4, prisma.v2);
                this.adicionarLinha(prisma.v4, prisma.v3);

                this.adicionarLinha(prisma.v1, prisma.v5);
                this.adicionarLinha(prisma.v2, prisma.v5);
                this.adicionarLinha(prisma.v3, prisma.v5);
                this.adicionarLinha(prisma.v4, prisma.v5);
            }

            projetarCubo(cubo) {
                const vertices = [
                    cubo.v1, cubo.v2, cubo.v3, cubo.v4,
                    cubo.v5, cubo.v6, cubo.v7, cubo.v8
                ];

                this.adicionarLinha(vertices[0], vertices[1]);
                this.adicionarLinha(vertices[1], vertices[3]);
                this.adicionarLinha(vertices[3], vertices[2]);
                this.adicionarLinha(vertices[2], vertices[0]);

                this.adicionarLinha(vertices[4], vertices[5]);
                this.adicionarLinha(vertices[5], vertices[7]);
                this.adicionarLinha(vertices[7], vertices[6]);
                this.adicionarLinha(vertices[6], vertices[4]);

                this.adicionarLinha(vertices[0], vertices[4]);
                this.adicionarLinha(vertices[1], vertices[5]);
                this.adicionarLinha(vertices[2], vertices[6]);
                this.adicionarLinha(vertices[3], vertices[7]);

                for (const vertice of vertices) {
                    if (vertice.visivel) {
                        const projecao = this.projetarPonto(vertice.posicao);
                        this.matrix[projecao.y][projecao.x] = '#';
                    }
                }
            }

            adicionarLinha(v1, v2) {
                if (v1.visivel && v2.visivel) {
                    const p1 = this.projetarPonto(v1.posicao);
                    const p2 = this.projetarPonto(v2.posicao);

                    this.desenharLinha(p1, p2);
                }
            }

            desenharLinha(p1, p2) {
                const dx = Math.abs(p2.x - p1.x);
                const dy = Math.abs(p2.y - p1.y);
                const sx = p1.x < p2.x ? 1 : -1;
                const sy = p1.y < p2.y ? 1 : -1;
                let err = dx - dy;

                while (true) {
                    this.matrix[p1.y][p1.x] = '#';

                    if (p1.x === p2.x && p1.y === p2.y) break;
                    const e2 = 2 * err;
                    if (e2 > -dy) {
                        err -= dy;
                        p1.x += sx;
                    }
                    if (e2 < dx) {
                        err += dx;
                        p1.y += sy;
                    }
                }
            }

            limparMatriz() {
                for (let i = 0; i < this.matrix.length; i++) {
                    for (let j = 0; j < this.matrix[i].length; j++) {
                        this.matrix[i][j] = '.';
                    }
                }
            }
        }

        const resX = 150;
        const resY = 70;
        const casaCubo = new Cubo(0, 0, 0, 30);
        const casaPrisma = new PrismaTriangular(-15, -15, 15, 30, 30, 30);

        let camX = 0;
        let camY = 0;
        let camZ = 0;
        let angX = -Math.PI / 16;
        let angY = -Math.PI / 8;

        const taxaRotacao = Math.PI / 48;

        const projecao = new Projecao(angX, angY, camX, camY, camZ, resX, resY);

        function animar() {
            // Atualiza a projeção com os novos ângulos e posição da câmera
            projecao.anguloX = angX;
            projecao.anguloY = angY;
            projecao.cameraPosicao.x = camX;
            projecao.cameraPosicao.y = camY;

            // Remove a tabela existente, se houver
            const existingTable = document.querySelector('table');
            if (existingTable) {
                document.body.removeChild(existingTable);
            }

            // Projetar os cubos com os novos ângulos e mostrar a nova projeção em HTML
            projecao.limparMatriz();
            projecao.projetarCubo(casaCubo);
            projecao.projetarPrismaTriangular(casaPrisma);
            mostrarProjecaoHTML();

            // Agende a próxima atualização
            requestAnimationFrame(animar);
        }

        document.addEventListener('keydown', function (event) {
            switch (event.key) {
                case 'w':
                    angX += taxaRotacao;
                    break;
                case 'a':
                    angY -= taxaRotacao;
                    break;
                case 's':
                    angX -= taxaRotacao;
                    break;
                case 'd':
                    angY += taxaRotacao;
                    break;
                case 'ArrowUp':
                    camY += 1;
                    break;
                case 'ArrowDown':
                    camY -= 1;
                    break;
                case 'ArrowLeft':
                    camX += 1;
                    break;
                case 'ArrowRight':
                    camX -= 1;
                    break;
            }
        });

        function mostrarProjecaoHTML() {
            const body = document.body;
            const table = document.createElement('table');

            for (let i = 0; i < projecao.matrix.length; i++) {
                const row = document.createElement('tr');
                for (let j = 0; j < projecao.matrix[i].length; j++) {
                    const cell = document.createElement('td');
                    cell.classList.add(projecao.matrix[i][j] === '#' ? 'visible' : 'hidden');
                    row.appendChild(cell);
                }
                table.appendChild(row);
            }

            body.appendChild(table);
        }

        // Inicie a animação
        animar();
