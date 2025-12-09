import { NextApiRequest, NextApiResponse } from 'next';
import { getCollection } from '../../lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { startDate,.
... (show more)