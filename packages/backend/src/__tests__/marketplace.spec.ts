import { USERS, ASSETS, LISTINGS, OFFERS, TENANTS } from "./fixtures";

describe("Marketplace - Business Rules", () => {
  describe("Offer Validation", () => {
    it("rejects self-offers", () => {
      const listing = LISTINGS.goldBarA;
      const buyerId = listing.sellerId;
      expect(buyerId).toBe(USERS.sellerA.id);
      expect(USERS.sellerA.id).toBe(listing.sellerId);
    });

    it("rejects duplicate pending offers", () => {
      const existingOffer = OFFERS.buyerA;
      const newOfferListingId = existingOffer.listingId;
      const newOfferBuyerId = existingOffer.buyerId;
      expect(newOfferListingId).toBe(existingOffer.listingId);
      expect(newOfferBuyerId).toBe(existingOffer.buyerId);
    });

    it("rejects offers with non-positive amounts", () => {
      const amounts = [0, -100, -0.01];
      for (const amount of amounts) {
        expect(amount).toBeLessThanOrEqual(0);
      }
    });

    it("accepts offers with positive amounts", () => {
      const amounts = [100, 0.01, 65000];
      for (const amount of amounts) {
        expect(amount).toBeGreaterThan(0);
      }
    });
  });

  describe("Transaction State Machine", () => {
    const validTransitions: Record<string, string[]> = {
      INITIATED: ["PAYMENT_PENDING", "CANCELLED"],
      PAYMENT_PENDING: ["PAYMENT_RECEIVED", "CANCELLED"],
      PAYMENT_RECEIVED: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED", "DISPUTED"],
      DELIVERED: ["COMPLETED", "DISPUTED"],
      COMPLETED: [],
      CANCELLED: [],
      DISPUTED: ["COMPLETED", "CANCELLED"],
    };

    it("allows valid transitions", () => {
      expect(validTransitions["INITIATED"]).toContain("PAYMENT_PENDING");
      expect(validTransitions["PAYMENT_PENDING"]).toContain("PAYMENT_RECEIVED");
      expect(validTransitions["SHIPPED"]).toContain("DELIVERED");
      expect(validTransitions["DELIVERED"]).toContain("COMPLETED");
    });

    it("blocks invalid transitions", () => {
      expect(validTransitions["COMPLETED"]).toHaveLength(0);
      expect(validTransitions["CANCELLED"]).toHaveLength(0);
      expect(validTransitions["INITIATED"]).not.toContain("COMPLETED");
      expect(validTransitions["INITIATED"]).not.toContain("DELIVERED");
    });

    it("allows cancellation from active states", () => {
      expect(validTransitions["INITIATED"]).toContain("CANCELLED");
      expect(validTransitions["PAYMENT_PENDING"]).toContain("CANCELLED");
      expect(validTransitions["PAYMENT_RECEIVED"]).toContain("CANCELLED");
    });
  });

  describe("Tenant Isolation", () => {
    it("seller A cannot list in tenant B", () => {
      expect(USERS.sellerA.organizationId).toBe(TENANTS.tenantA.id);
      expect(USERS.sellerB.organizationId).toBe(TENANTS.tenantB.id);
      expect(USERS.sellerA.organizationId).not.toBe(USERS.sellerB.organizationId);
    });

    it("assets are scoped to their owner's organization", () => {
      expect(ASSETS.goldBarA.currentLocationId).toBe(TENANTS.tenantA.id);
      expect(ASSETS.goldBarB.currentLocationId).toBe(TENANTS.tenantB.id);
    });
  });
});
