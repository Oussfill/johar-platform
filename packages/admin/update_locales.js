const fs = require('fs');
const path = require('path');

const newEnKeys = {
  "navServices": "Services",
  "navSecurity": "Security",
  "navAbout": "About JOHAR",
  "badge": "Enterprise Trading Platform",
  "heroTitle1": "The Future of Trading",
  "heroTitle2": "Gold & Jewelry",
  "heroSubtitle": "A unified digital ecosystem for tokenizing, trading, and safeguarding gold and jewelry with supreme enterprise and security standards.",
  "explore": "Enter Platform",
  "learnMore": "Discover More",
  "unifiedPlatform": "Unified Business Services",
  "unifiedDesc": "Complete digital infrastructure for the asset lifecycle, from lab testing to final delivery.",
  "srvIdentity": "Digital Identity",
  "srvIdentityDesc": "Issue immutable digital passports and ownership certificates for every gold asset.",
  "srvMarketplace": "Marketplace & Auctions",
  "srvMarketplaceDesc": "Secure B2B trading, bidding, and live authenticated auctions.",
  "srvCompliance": "KYC & Compliance",
  "srvComplianceDesc": "Advanced identity verification (KYC) and sanctions screening for a safe trading environment.",
  "srvLogistics": "Logistics Services",
  "srvLogisticsDesc": "Secure transport management, custody transfer, and verified vault storage.",
  "srvLab": "Laboratory Integration",
  "srvLabDesc": "Direct and reliable recording of lab assay results and purities by certified labs.",
  "srvFinance": "Financial Management",
  "srvFinanceDesc": "Comprehensive management of invoices, payments, and contract settlements with real-time performance reports.",
  "securityTitle1": "Built on Foundations of",
  "securityTitle2": "Absolute Trust & Security",
  "securityDesc": "Security is our core. We apply the highest standards of data isolation and protection to ensure absolute privacy for your company's information and commercial assets.",
  "secIsolation": "Complete Data Isolation",
  "secIsolationDesc": "Absolute privacy for each company or commercial entity's data without any overlap.",
  "secRbac": "Granular Access Control",
  "secRbacDesc": "Advanced role system ensuring each employee and partner accesses only what concerns them.",
  "secAudit": "Comprehensive Audit Trail",
  "secAuditDesc": "Precise documentation of every action or change in the system to ensure transparency and accountability.",
  "certTitle": "Highest Certification Standards",
  "certSubtitle": "Enterprise Security Grade",
  "techEncryption": "Encryption",
  "techEncryptionVal": "Advanced Banking Standards",
  "techAuth": "Authentication",
  "techAuthVal": "Strict Security Verification",
  "techAudit": "Monitoring",
  "techAuditVal": "24/7 Continuous Audit Systems",
  "ctaTitle": "Ready to Digitize Your Business?",
  "ctaSubtitle": "Join the new standard in global gold and jewelry management and trading.",
  "enterPlatform": "Start Now with JOHAR",
  "copyright": "JOHAR Platform. All rights reserved.",
  "privacy": "Privacy",
  "terms": "Terms",
  "compliancePolicy": "Compliance"
};

const newFrKeys = {
  "navServices": "Services",
  "navSecurity": "Sécurité",
  "navAbout": "À propos de JOHAR",
  "badge": "Plateforme de Trading d'Entreprise",
  "heroTitle1": "L'avenir du trading",
  "heroTitle2": "Or et Bijoux",
  "heroSubtitle": "Un écosystème numérique unifié pour la tokenisation, le trading et la sauvegarde de l'or et des bijoux avec des normes de sécurité et d'entreprise suprêmes.",
  "explore": "Entrer dans la plateforme",
  "learnMore": "Découvrir plus",
  "unifiedPlatform": "Services d'Entreprise Unifiés",
  "unifiedDesc": "Infrastructure numérique complète pour le cycle de vie des actifs, des tests en laboratoire à la livraison finale.",
  "srvIdentity": "Identité Numérique",
  "srvIdentityDesc": "Émettre des passeports numériques immuables et des certificats de propriété pour chaque actif en or.",
  "srvMarketplace": "Marché et Enchères",
  "srvMarketplaceDesc": "Trading B2B sécurisé, soumissions et enchères en direct authentifiées.",
  "srvCompliance": "KYC & Conformité",
  "srvComplianceDesc": "Vérification d'identité avancée (KYC) et filtrage des sanctions pour un environnement de trading sûr.",
  "srvLogistics": "Services Logistiques",
  "srvLogisticsDesc": "Gestion sécurisée du transport, transfert de garde et stockage en coffre vérifié.",
  "srvLab": "Intégration de Laboratoire",
  "srvLabDesc": "Enregistrement direct et fiable des résultats d'essais en laboratoire et des puretés par des laboratoires certifiés.",
  "srvFinance": "Gestion Financière",
  "srvFinanceDesc": "Gestion complète des factures, des paiements et des règlements de contrats avec des rapports de performance en temps réel.",
  "securityTitle1": "Construit sur des fondations de",
  "securityTitle2": "Confiance et Sécurité Absolues",
  "securityDesc": "La sécurité est notre cœur de métier. Nous appliquons les normes les plus élevées en matière d'isolation et de protection des données pour assurer une confidentialité absolue.",
  "secIsolation": "Isolation Complète des Données",
  "secIsolationDesc": "Confidentialité absolue pour les données de chaque entreprise sans aucun chevauchement.",
  "secRbac": "Contrôle d'Accès Granulaire",
  "secRbacDesc": "Système de rôles avancé garantissant que chaque employé n'accède qu'à ce qui le concerne.",
  "secAudit": "Piste d'Audit Complète",
  "secAuditDesc": "Documentation précise de chaque action ou changement dans le système pour assurer la transparence.",
  "certTitle": "Normes de Certification les plus Élevées",
  "certSubtitle": "Niveau de Sécurité Entreprise",
  "techEncryption": "Chiffrement",
  "techEncryptionVal": "Normes Bancaires Avancées",
  "techAuth": "Authentification",
  "techAuthVal": "Vérification de Sécurité Stricte",
  "techAudit": "Surveillance",
  "techAuditVal": "Systèmes d'Audit Continus 24/7",
  "ctaTitle": "Prêt à numériser votre entreprise ?",
  "ctaSubtitle": "Rejoignez la nouvelle norme mondiale en matière de gestion et de trading de l'or et des bijoux.",
  "enterPlatform": "Commencez maintenant avec JOHAR",
  "copyright": "Plateforme JOHAR. Tous droits réservés.",
  "privacy": "Confidentialité",
  "terms": "Conditions",
  "compliancePolicy": "Conformité"
};

const enPath = path.join('src', 'locales', 'en.json');
const frPath = path.join('src', 'locales', 'fr.json');

let enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let frJson = JSON.parse(fs.readFileSync(frPath, 'utf8'));

enJson.landing = { ...(enJson.landing || {}), ...newEnKeys };
frJson.landing = { ...(frJson.landing || {}), ...newFrKeys };

fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
fs.writeFileSync(frPath, JSON.stringify(frJson, null, 2));
console.log('Translations updated successfully.');
