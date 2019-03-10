/**
 * EBook object as retrieved from server
 */
export interface EBook {

    bookId: string;
    bookUrl: string;
    description?: string;
    imageUrl: string;
    publisherId: string;
    publisherName: string;
    qrCode: string;
    title: string;
}

