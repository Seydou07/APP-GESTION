import { PrismaClient, ProductStatus, SaleStatus, DebtStatus, CashMovementType, MovementType, WarehouseStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Démarrage de la création des données de test...");

    // 1. Nettoyer les anciennes données (sauf le magasin principal déjà créé)
    await prisma.$transaction([
        prisma.activityLog.deleteMany(),
        prisma.debtPayment.deleteMany(),
        prisma.customerDebt.deleteMany(),
        prisma.ticket.deleteMany(),
        prisma.invoice.deleteMany(),
        prisma.saleItem.deleteMany(),
        prisma.sale.deleteMany(),
        prisma.expense.deleteMany(),
        prisma.expenseCategory.deleteMany(),
        prisma.cashMovement.deleteMany(),
        prisma.stockHistory.deleteMany(),
        prisma.stockMovement.deleteMany(),
        prisma.stockLevel.deleteMany(),
        prisma.productPrice.deleteMany(),
        prisma.product.deleteMany(),
        prisma.category.deleteMany(),
        prisma.client.deleteMany(),
        prisma.supplier.deleteMany(),
        prisma.purchaseReceiptItem.deleteMany(),
        prisma.purchaseReceipt.deleteMany(),
        prisma.purchaseOrderItem.deleteMany(),
        prisma.purchaseOrder.deleteMany(),
        prisma.employeePayment.deleteMany(),
        prisma.employee.deleteMany(),
    ]);

    // 2. Catégories de dépenses
    const expenseCategories = await Promise.all([
        prisma.expenseCategory.create({ data: { name: "Loyer" } }),
        prisma.expenseCategory.create({ data: { name: "Electricité" } }),
        prisma.expenseCategory.create({ data: { name: "Eau" } }),
        prisma.expenseCategory.create({ data: { name: "Salaire" } }),
        prisma.expenseCategory.create({ data: { name: "Carburant" } }),
        prisma.expenseCategory.create({ data: { name: "Fournitures de bureau" } }),
        prisma.expenseCategory.create({ data: { name: "Publicité" } }),
        prisma.expenseCategory.create({ data: { name: "Maintenance" } }),
    ]);

    // 3. Catégories de produits
    const categories = await Promise.all([
        prisma.category.create({ data: { name: "Boissons" } }),
        prisma.category.create({ data: { name: "Snacks" } }),
        prisma.category.create({ data: { name: "Épicerie" } }),
        prisma.category.create({ data: { name: "Électronique" } }),
        prisma.category.create({ data: { name: "Hygiene & Beauté" } }),
    ]);

    // 4. Entrepôt
    const warehouse = await prisma.warehouse.upsert({
        where: { id: 1 },
        update: {},
        create: { name: "Entrepôt Principal", address: "123 Rue du Commerce, Abidjan" }
    });

    // 5. Produits
    const productsData = [
        { code: "PROD001", name: "Coca-Cola 50cl", costPrice: 300, salePrice: 500, stockMin: 20, unit: "bouteille", categoryId: categories[0].id },
        { code: "PROD002", name: "Fanta Orange 50cl", costPrice: 300, salePrice: 500, stockMin: 20, unit: "bouteille", categoryId: categories[0].id },
        { code: "PROD003", name: "Sprite 50cl", costPrice: 300, salePrice: 500, stockMin: 20, unit: "bouteille", categoryId: categories[0].id },
        { code: "PROD004", name: "Eau Vital 1.5L", costPrice: 200, salePrice: 350, stockMin: 30, unit: "bouteille", categoryId: categories[0].id },
        { code: "PROD005", name: "Biscuits Choco", costPrice: 250, salePrice: 400, stockMin: 15, unit: "paquet", categoryId: categories[1].id },
        { code: "PROD006", name: "Chips Plantain", costPrice: 200, salePrice: 350, stockMin: 15, unit: "sachet", categoryId: categories[1].id },
        { code: "PROD007", name: "Riz Local 5kg", costPrice: 2500, salePrice: 4000, stockMin: 10, unit: "sac", categoryId: categories[2].id },
        { code: "PROD008", name: "Huile 1L", costPrice: 1200, salePrice: 2000, stockMin: 12, unit: "bouteille", categoryId: categories[2].id },
        { code: "PROD009", name: "Chargeur USB-C", costPrice: 1500, salePrice: 3000, stockMin: 5, unit: "pièce", categoryId: categories[3].id },
        { code: "PROD010", name: "Savon Antibactérien", costPrice: 400, salePrice: 700, stockMin: 25, unit: "pièce", categoryId: categories[4].id },
    ];

    const products = await Promise.all(
        productsData.map(data => prisma.product.create({ data: { ...data, statut: ProductStatus.ACTIF } }))
    );

    // 6. Initialiser le stock pour chaque produit
    for (const product of products) {
        const initialQty = Math.floor(Math.random() * 50) + 20; // 20-70 pièces
        // Créer niveau de stock
        await prisma.stockLevel.create({
            data: {
                productId: product.id,
                warehouseId: warehouse.id,
                quantity: initialQty
            }
        });
        // Créer mouvement de stock initial
        await prisma.stockMovement.create({
            data: {
                productId: product.id,
                warehouseId: warehouse.id,
                type: MovementType.ENTREE,
                quantity: initialQty,
                note: "Stock initial",
                moveDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            }
        });
    }

    // 7. Clients
    const clients = await Promise.all([
        prisma.client.create({ data: { name: "Jean Dupont", phone: "+2250123456789", email: "jean@example.com", creditLimit: 50000 } }),
        prisma.client.create({ data: { name: "Marie Koné", phone: "+2250123456790", email: "marie@example.com", creditLimit: 30000 } }),
        prisma.client.create({ data: { name: "Ahmed Traoré", phone: "+2250123456791", creditLimit: 100000 } }),
        prisma.client.create({ data: { name: "Sophie Yao", phone: "+2250123456792", creditLimit: 25000 } }),
        prisma.client.create({ data: { name: "Paul Kouassi", phone: "+2250123456793", creditLimit: 75000 } }),
    ]);

    // 8. Fournisseurs
    const suppliers = await Promise.all([
        prisma.supplier.create({ data: { name: "Distribution ABC", phone: "+2250987654321", email: "contact@abc-distribution.ci", address: "Port-Bouët, Abidjan" } }),
        prisma.supplier.create({ data: { name: "Import Express", phone: "+2250987654322", email: "info@import-express.ci", address: "Koumassi, Abidjan" } }),
        prisma.supplier.create({ data: { name: "Groupe Boissons CI", phone: "+2250987654323", email: "sales@gbci.ci", address: "Yopougon, Abidjan" } }),
    ]);

    // 9. Employés
    const employees = await Promise.all([
        prisma.employee.create({ data: { firstName: "Koffi", lastName: "Pierre", position: "Caissier", salaryBase: 80000, phone: "+2250765432109" } }),
        prisma.employee.create({ data: { firstName: "Adjoua", lastName: "Aïcha", position: "Vendeuse", salaryBase: 65000, phone: "+2250765432110" } }),
        prisma.employee.create({ data: { firstName: "Bakary", lastName: "Koné", position: "Magasinier", salaryBase: 70000, phone: "+2250765432111" } }),
    ]);

    // 10. Créer des ventes (derniers 14 jours)
    const user = await prisma.user.findFirst({ where: { email: "admin@gmail.com" } });
    const sales = [];

    for (let i = 0; i < 25; i++) {
        const saleDate = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
        const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items par vente
        const saleItems: any[] = [];
        let totalHt = 0;
        let totalTtc = 0;

        // Sélectionner des produits aléatoires
        const selectedProducts = [];
        for (let j = 0; j < numItems; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            if (selectedProducts.includes(product.id)) continue; // éviter les doublons
            selectedProducts.push(product.id);

            const qty = Math.floor(Math.random() * 5) + 1;
            const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0;
            const subtotal = (product.salePrice * qty) - discount;

            saleItems.push({
                designation: product.name,
                productId: product.id,
                quantity: qty,
                priceUnit: product.salePrice,
                costPrice: product.costPrice,
                discount: discount,
                subtotal: subtotal
            });

            totalHt += subtotal / 1.18;
            totalTtc += subtotal;
        }

        const totalTva = totalTtc - totalHt;
        const isCreditSale = Math.random() > 0.85; // ~15% ventes à crédit
        const paidAmount = isCreditSale ? totalTtc * (Math.random() * 0.3 + 0.2) : totalTtc; // 20-50% paiement partiel
        const status = isCreditSale ? (paidAmount >= totalTtc ? SaleStatus.PAYEE : SaleStatus.PARTIELLE) : SaleStatus.PAYEE;
        const paymentMethods = ["ESPECES", "CARTE", "CHEQUE", "MIXTE"];
        const client = Math.random() > 0.5 ? clients[Math.floor(Math.random() * clients.length)] : null;

        // Créer la vente
        const sale = await prisma.sale.create({
            data: {
                saleDate: saleDate,
                totalHt: Math.round(totalHt * 100) / 100,
                totalTva: Math.round(totalTva * 100) / 100,
                totalTtc: Math.round(totalTtc * 100) / 100,
                paidAmount: Math.round(paidAmount * 100) / 100,
                status: status,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                userId: user?.id,
                clientId: client?.id || null,
                items: { create: saleItems }
            }
        });
        sales.push(sale);

        // Mettre à jour le stock pour chaque article vendu
        for (const item of saleItems) {
            // Décrémenter le niveau de stock
            const stockLevel = await prisma.stockLevel.findFirst({ where: { productId: item.productId, warehouseId: warehouse.id } });
            if (stockLevel) {
                await prisma.stockLevel.update({
                    where: { id: stockLevel.id },
                    data: { quantity: Math.max(0, stockLevel.quantity - item.quantity) }
                });
            }
            // Créer mouvement de sortie
            await prisma.stockMovement.create({
                data: {
                    productId: item.productId,
                    warehouseId: warehouse.id,
                    type: MovementType.SORTIE,
                    quantity: item.quantity,
                    note: `Vente #${sale.id}`,
                    moveDate: saleDate,
                    refType: "VENTE",
                    refId: sale.id
                }
            });
        }

        // Créer ticket de caisse
        await prisma.ticket.create({
            data: {
                saleId: sale.id,
                ticketNumber: `TKT-${new Date(saleDate).getFullYear()}-${String(sale.id).padStart(5, '0')}`,
                printDate: saleDate
            }
        });

        // Créer facture pour les ventes avec client
        if (client) {
            await prisma.invoice.create({
                data: {
                    saleId: sale.id,
                    clientId: client.id,
                    invoiceNumber: `FAC-${new Date(saleDate).getFullYear()}-${String(sale.id).padStart(5, '0')}`,
                    invoiceDate: saleDate,
                    dueDate: new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                    totalHt: Math.round(totalHt * 100) / 100,
                    totalTva: Math.round(totalTva * 100) / 100,
                    totalTtc: Math.round(totalTtc * 100) / 100,
                    status: status === SaleStatus.PAYEE ? 'PAYEE' : 'ENVOYEE'
                }
            });
        }

        // Créer dette si vente partielle ou à crédit
        if (isCreditSale && status !== SaleStatus.PAYEE) {
            const debt = await prisma.customerDebt.create({
                data: {
                    saleId: sale.id,
                    clientId: client?.id,
                    amountInitial: totalTtc,
                    amountDue: totalTtc - paidAmount,
                    dueDate: new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                    status: DebtStatus.EN_COURS
                }
            });

            // Ajouter un paiement partiel
            if (paidAmount > 0) {
                await prisma.debtPayment.create({
                    data: {
                        debtId: debt.id,
                        amount: paidAmount,
                        paymentDate: saleDate,
                        method: sale.paymentMethod || "ESPECES",
                        note: "Acompte"
                    }
                });
            }
        }

        // Créer mouvement de caisse pour l'argent reçu
        if (paidAmount > 0) {
            await prisma.cashMovement.create({
                data: {
                    type: CashMovementType.ENTREE,
                    source: "VENTE",
                    referenceId: sale.id,
                    amount: paidAmount,
                    note: `Vente #${sale.id}`,
                    moveDate: saleDate,
                    userId: user?.id
                }
            });
        }
    }

    // 11. Dépenses (derniers 30 jours)
    for (let i = 0; i < 12; i++) {
        const expenseDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        const amounts = [15000, 25000, 40000, 80000, 120000, 15000, 30000, 10000, 50000];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        const descriptions = [
            "Paiement loyer",
            "Facture électricité",
            "Approvisionnement papeterie",
            "Carburant camion",
            "Maintenance matériel",
            "Publicité réseaux sociaux",
            "Fournitures nettoyage"
        ];

        const expense = await prisma.expense.create({
            data: {
                expenseDate: expenseDate,
                categoryId: category.id,
                amount: amount,
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                notes: "Paiement enregistré"
            }
        });

        // Créer mouvement de caisse pour la dépense
        await prisma.cashMovement.create({
            data: {
                type: CashMovementType.SORTIE,
                source: "DEPENSE",
                referenceId: expense.id,
                amount: amount,
                note: expense.description || "Dépense",
                moveDate: expenseDate,
                userId: user?.id
            }
        });
    }

    // 12. Commandes d'achat et réceptions
    const po = await prisma.purchaseOrder.create({
        data: {
            supplierId: suppliers[0].id,
            orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            status: "RECU",
            notes: "Approvisionnement mensuel",
            items: {
                create: [
                    { productId: products[0].id, quantity: 50, priceUnit: 280, discount: 0, subtotal: 50 * 280 },
                    { productId: products[1].id, quantity: 50, priceUnit: 280, discount: 0, subtotal: 50 * 280 },
                    { productId: products[2].id, quantity: 40, priceUnit: 280, discount: 0, subtotal: 40 * 280 },
                    { productId: products[3].id, quantity: 60, priceUnit: 180, discount: 0, subtotal: 60 * 180 },
                ]
            }
        }
    });

    // Réception complète de la commande
    const receipt = await prisma.purchaseReceipt.create({
        data: {
            orderId: po.id,
            receiptDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: "COMPLETE",
            total: 50 * 280 + 50 * 280 + 40 * 280 + 60 * 180,
            notes: "Reçu en bonne et due forme",
            items: {
                create: [
                    { productId: products[0].id, quantity: 50, priceUnit: 280 },
                    { productId: products[1].id, quantity: 50, priceUnit: 280 },
                    { productId: products[2].id, quantity: 40, priceUnit: 280 },
                    { productId: products[3].id, quantity: 60, priceUnit: 180 },
                ]
            }
        }
    });

    // Mettre à jour le stock pour la réception
    const receiptItems = await prisma.purchaseReceiptItem.findMany({ where: { receiptId: receipt.id } });
    for (const item of receiptItems) {
        const stockLevel = await prisma.stockLevel.findFirst({ where: { productId: item.productId, warehouseId: warehouse.id } });
        if (stockLevel) {
            await prisma.stockLevel.update({
                where: { id: stockLevel.id },
                data: { quantity: stockLevel.quantity + item.quantity }
            });
        } else {
            await prisma.stockLevel.create({
                data: {
                    productId: item.productId,
                    warehouseId: warehouse.id,
                    quantity: item.quantity
                }
            });
        }

        // Créer mouvement de stock
        await prisma.stockMovement.create({
            data: {
                productId: item.productId,
                warehouseId: warehouse.id,
                type: MovementType.ENTREE,
                quantity: item.quantity,
                note: `Réception #${receipt.id}`,
                moveDate: receipt.receiptDate,
                refType: "ACHAT",
                refId: receipt.id
            }
        });
    }

    console.log("✅ Données de test créées avec succès !");
    console.log(`
    📊 Résumé :
    - ${products.length} produits
    - ${categories.length} catégories
    - ${clients.length} clients
    - ${suppliers.length} fournisseurs
    - ${employees.length} employés
    - ${sales.length} ventes
    - ${expenseCategories.length} catégories de dépenses
    `);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
