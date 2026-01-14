import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { CatalogItem, Configuration } from '@shared/schema';

const BRAND_MAROON = '#800020';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND_MAROON,
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
  },
  logo: {
    width: 70,
    height: 70,
    objectFit: 'contain',
  },
  businessInfoCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 9,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  businessContact: {
    fontSize: 9,
    color: '#333',
    marginTop: 4,
  },
  catalogTitleContainer: {
    width: 120,
    alignItems: 'flex-end',
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_MAROON,
  },
  catalogSubtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  
  introSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#fdf5f7',
    borderRadius: 4,
  },
  introTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 8,
  },
  introText: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.5,
  },
  
  packageLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 15,
  },
  packageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  ultraBadge: {
    backgroundColor: '#9333ea',
  },
  premiumBadge: {
    backgroundColor: '#d97706',
  },
  budgetBadge: {
    backgroundColor: '#16a34a',
  },
  packageBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  serviceSection: {
    marginBottom: 20,
  },
  serviceTitleRow: {
    backgroundColor: BRAND_MAROON,
    padding: 10,
    marginBottom: 0,
  },
  serviceTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  packageColumns: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#ddd',
  },
  packageColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  packageColumnLast: {
    flex: 1,
    borderRightWidth: 0,
  },
  packageHeader: {
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  ultraHeader: {
    backgroundColor: '#f3e8ff',
  },
  premiumHeader: {
    backgroundColor: '#fef3c7',
  },
  budgetHeader: {
    backgroundColor: '#dcfce7',
  },
  packageHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ultraHeaderText: {
    color: '#9333ea',
  },
  premiumHeaderText: {
    color: '#d97706',
  },
  budgetHeaderText: {
    color: '#16a34a',
  },
  packageItems: {
    padding: 8,
    minHeight: 60,
  },
  packageItem: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 9,
    color: BRAND_MAROON,
    fontWeight: 'bold',
  },
  noItems: {
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
  },
  
  footerSection: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerColumn: {
    flex: 1,
    paddingRight: 15,
  },
  footerColumnLast: {
    flex: 1,
    paddingRight: 0,
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BRAND_MAROON,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#333',
    lineHeight: 1.4,
  },
  footerItem: {
    fontSize: 8,
    color: '#333',
    marginBottom: 3,
  },
  
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
});

function formatIndianCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs.${formatter.format(amount)}`;
}

interface CatalogTemplateProps {
  catalogItems: CatalogItem[];
  configuration: Configuration;
  packages: string[];
  filterInfo?: {
    service: string | null;
    packages: string[] | null;
    totalItems: number;
  };
}

export function ServerCatalogTemplate({ catalogItems, configuration, packages, filterInfo }: CatalogTemplateProps) {
  const groupedByService = catalogItems.reduce((acc, item) => {
    if (!acc[item.serviceType]) {
      acc[item.serviceType] = {};
    }
    if (!acc[item.serviceType][item.package]) {
      acc[item.serviceType][item.package] = [];
    }
    acc[item.serviceType][item.package].push(item);
    return acc;
  }, {} as Record<string, Record<string, CatalogItem[]>>);

  const services = Object.keys(groupedByService);

  // Get packages that actually have items (globally or per service)
  const getAvailablePackages = (serviceType?: string) => {
    if (serviceType) {
      // For a specific service, only return packages that have items
      const serviceData = groupedByService[serviceType];
      if (!serviceData) return [];
      return packages.filter(pkg => serviceData[pkg] && serviceData[pkg].length > 0);
    }
    // Globally, return packages that have at least one item across all services
    const usedPackages = new Set<string>();
    Object.values(groupedByService).forEach(serviceData => {
      Object.keys(serviceData).forEach(pkg => {
        if (serviceData[pkg].length > 0) {
          usedPackages.add(pkg);
        }
      });
    });
    // Return in the order defined in packages array
    return packages.filter(pkg => usedPackages.has(pkg));
  };

  // Get packages to show in legend (only those with items)
  const availablePackagesForLegend = getAvailablePackages();

  const getPackageHeaderStyle = (pkg: string) => {
    switch (pkg.toLowerCase()) {
      case 'ultra': return styles.ultraHeader;
      case 'premium': return styles.premiumHeader;
      case 'budget': return styles.budgetHeader;
      default: return {};
    }
  };

  const getPackageTextStyle = (pkg: string) => {
    switch (pkg.toLowerCase()) {
      case 'ultra': return styles.ultraHeaderText;
      case 'premium': return styles.premiumHeaderText;
      case 'budget': return styles.budgetHeaderText;
      default: return {};
    }
  };

  const getPackageBadgeStyle = (pkg: string) => {
    switch (pkg.toLowerCase()) {
      case 'ultra': return styles.ultraBadge;
      case 'premium': return styles.premiumBadge;
      case 'budget': return styles.budgetBadge;
      default: return {};
    }
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            {configuration.logo && (
              <Image src={configuration.logo} style={styles.logo} />
            )}
          </View>
          
          <View style={styles.businessInfoCenter}>
            <Text style={styles.businessName}>{configuration.businessName}</Text>
            {configuration.address && (
              <Text style={styles.businessAddress}>{configuration.address}</Text>
            )}
            {(configuration.phone || configuration.email) && (
              <Text style={styles.businessContact}>
                {configuration.phone}{configuration.phone && configuration.email ? ' | ' : ''}{configuration.email}
              </Text>
            )}
          </View>
          
          <View style={styles.catalogTitleContainer}>
            <Text style={styles.catalogTitle}>SERVICE</Text>
            <Text style={styles.catalogTitle}>CATALOG</Text>
            <Text style={styles.catalogSubtitle}>{currentDate}</Text>
          </View>
        </View>
        
        <View style={styles.headerLine} />

        <View style={styles.introSection}>
          <Text style={styles.introTitle}>
            {filterInfo?.service || (filterInfo?.packages && filterInfo.packages.length > 0)
              ? `${filterInfo.service ? filterInfo.service + ' ' : ''}${filterInfo.packages && filterInfo.packages.length > 0 ? filterInfo.packages.join(', ') + ' ' : ''}Service Catalog`
              : 'Welcome to Our Service Catalog'
            }
          </Text>
          <Text style={styles.introText}>
            {filterInfo?.service || (filterInfo?.packages && filterInfo.packages.length > 0)
              ? `Showing ${filterInfo.totalItems} items${filterInfo.service ? ` for ${filterInfo.service} service` : ''}${filterInfo.packages && filterInfo.packages.length > 0 ? ` in ${filterInfo.packages.join(', ')} package${filterInfo.packages.length > 1 ? 's' : ''}` : ''}.`
              : 'We offer three distinct service packages to meet your needs and budget. Our Ultra package provides the most comprehensive service with premium materials and features. The Premium package offers excellent value with high-quality options. The Budget package delivers essential services at competitive rates.'
            }
          </Text>
        </View>

        {availablePackagesForLegend.length > 0 && (
          <View style={styles.packageLegend}>
            {availablePackagesForLegend.map((pkg) => (
              <View key={pkg} style={[styles.packageBadge, getPackageBadgeStyle(pkg)]}>
                <Text style={styles.packageBadgeText}>{pkg}</Text>
              </View>
            ))}
          </View>
        )}

        {services.map((service) => {
          const availablePackagesForService = getAvailablePackages(service);
          if (availablePackagesForService.length === 0) return null;

          return (
            <View key={service} style={styles.serviceSection} wrap={false}>
              <View style={styles.serviceTitleRow}>
                <Text style={styles.serviceTitle}>{service}</Text>
              </View>
              
              <View style={styles.packageColumns}>
                {availablePackagesForService.map((pkg, index) => {
                  const items = groupedByService[service][pkg] || [];
                  const isLast = index === availablePackagesForService.length - 1;
                
                return (
                  <View 
                    key={pkg} 
                    style={isLast ? styles.packageColumnLast : styles.packageColumn}
                  >
                    <View style={[styles.packageHeader, getPackageHeaderStyle(pkg)]}>
                      <Text style={[styles.packageHeaderText, getPackageTextStyle(pkg)]}>
                        {pkg}
                      </Text>
                    </View>
                    <View style={styles.packageItems}>
                      {items.map((item) => (
                        <View key={item.id} style={styles.packageItem}>
                          <Text style={styles.itemName}>{item.itemName}</Text>
                          {item.description && (
                            <Text style={styles.itemDescription}>{item.description}</Text>
                          )}
                          <Text style={styles.itemPrice}>
                            {formatIndianCurrency(parseFloat(item.price || '0'))}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
        })}

        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerTitle}>Contact Us</Text>
              {configuration.phone && (
                <Text style={styles.footerItem}>Phone: {configuration.phone}</Text>
              )}
              {configuration.email && (
                <Text style={styles.footerItem}>Email: {configuration.email}</Text>
              )}
              {configuration.website && (
                <Text style={styles.footerItem}>Website: {configuration.website}</Text>
              )}
            </View>
            <View style={styles.footerColumnLast}>
              <Text style={styles.footerTitle}>Notes</Text>
              <Text style={styles.footerText}>
                Prices are subject to change. Custom packages available on request. 
                GST extra as applicable. Contact us for detailed quotations.
              </Text>
            </View>
          </View>
        </View>

        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} 
          fixed 
        />
      </Page>
    </Document>
  );
}
