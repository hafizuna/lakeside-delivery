declare class PushNotificationService {
    private static instance;
    private expo;
    private constructor();
    static getInstance(): PushNotificationService;
    /**
     * Send push notification to user if they're not connected via socket
     */
    sendNotificationToUser(userId: number, title: string, body: string, data?: Record<string, any>): Promise<boolean>;
    /**
     * Send order status update push notification
     */
    sendOrderUpdateNotification(customerId: number, orderId: number, orderStatus: string, restaurantName: string, estimatedTime?: string): Promise<boolean>;
    /**
     * Send order cancellation push notification
     */
    sendOrderCancellationNotification(customerId: number, orderId: number, reason: string, refundAmount?: number): Promise<boolean>;
    /**
     * Send individual push notification
     */
    private sendPushNotification;
    /**
     * Get user's push token from database
     * Note: You'll need to create a table to store user push tokens
     */
    private getUserPushToken;
    /**
     * Remove invalid push token from database
     */
    private removeInvalidPushToken;
    /**
     * Generate notification content based on order status
     */
    private getOrderNotificationContent;
    /**
     * Test function to verify push notification setup
     */
    testPushNotification(pushToken: string): Promise<boolean>;
    /**
     * Get service statistics
     */
    getStats(): {
        expoSdkInstalled: boolean;
        accessToken: boolean;
    };
}
declare const _default: PushNotificationService;
export default _default;
//# sourceMappingURL=pushNotificationService.d.ts.map