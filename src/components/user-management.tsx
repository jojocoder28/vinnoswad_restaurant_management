
"use client";

import type { User, UserStatus, DecodedToken, Order, MenuItem, Waiter } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, Trash2, ShieldAlert, PlusCircle, User as UserIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useState } from 'react';
import UserForm from './user-form';
import UserProfileModal from './user-profile-modal';

interface UserManagementProps {
  users: User[];
  orders: Order[];
  menuItems: MenuItem[];
  waiters: Waiter[];
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (userData: Omit<User, 'id' | 'status'>) => void;
  currentUser: DecodedToken;
}

const statusStyles = {
    pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-700 border-green-500/30",
}

export default function UserManagement({ users, orders, menuItems, waiters, onUpdateUserStatus, onDeleteUser, onCreateUser, currentUser }: UserManagementProps) {
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };
  
  const confirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleSaveUser = (userData: Omit<User, 'id' | 'status'>) => {
    onCreateUser(userData);
  }

  const handleViewProfile = (user: User) => {
    setViewingUser(user);
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-headline font-semibold">User Accounts</h3>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusStyles[user.status])}>
                        {user.status}
                    </Badge>
                </TableCell>
                <TableCell>
                  {user.id !== currentUser.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         {user.role === 'waiter' && (
                          <>
                            <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                              <UserIcon className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {user.status === 'pending' && (
                            <DropdownMenuItem onClick={() => onUpdateUserStatus(user.id, 'approved')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10" 
                            onClick={() => handleDeleteClick(user)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the account for <span className="font-bold">{userToDelete?.name}</span> and remove all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete user
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {isFormOpen && (
            <UserForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveUser}
            />
        )}
        {viewingUser && (
            <UserProfileModal
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
                user={viewingUser}
                orders={orders}
                menuItems={menuItems}
                waiters={waiters}
            />
        )}
    </div>
  );
}
