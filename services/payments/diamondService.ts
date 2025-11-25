import { getMechanic, updateMechanicDiamonds, createTransaction } from '../firebase/firestore';
import { DIAMOND_COST_PER_PROPOSAL } from '@/constants/theme';

export const deductDiamondsForProposal = async (mechanicId: string): Promise<boolean> => {
    try {
        const mechanic = await getMechanic(mechanicId);

        if (!mechanic) {
            throw new Error('Mechanic not found');
        }

        if (mechanic.diamondBalance < DIAMOND_COST_PER_PROPOSAL) {
            return false; // Insufficient balance
        }

        // Deduct diamonds
        await updateMechanicDiamonds(mechanicId, DIAMOND_COST_PER_PROPOSAL, 'subtract');

        // Create transaction record
        await createTransaction({
            userId: mechanicId,
            type: 'deduction',
            amount: DIAMOND_COST_PER_PROPOSAL,
            status: 'completed',
        });

        return true;
    } catch (error) {
        console.error('Error deducting diamonds:', error);
        throw error;
    }
};

export const refundDiamonds = async (mechanicId: string, bookingId: string) => {
    try {
        await updateMechanicDiamonds(mechanicId, DIAMOND_COST_PER_PROPOSAL, 'add');

        await createTransaction({
            userId: mechanicId,
            type: 'refund',
            amount: DIAMOND_COST_PER_PROPOSAL,
            relatedBookingId: bookingId,
            status: 'completed',
        });
    } catch (error) {
        console.error('Error refunding diamonds:', error);
        throw error;
    }
};

export const checkDiamondBalance = async (mechanicId: string): Promise<number> => {
    const mechanic = await getMechanic(mechanicId);
    return mechanic?.diamondBalance || 0;
};
