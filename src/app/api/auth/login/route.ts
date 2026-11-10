import { NextRequest, NextResponse } from 'next/server';
import { signSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth-server';
import { initialStaff, initialAdminUsers } from '@/lib/initial-data';
import { hasSqlInjection, sanitizePhoneNumber, verifyPassword, hashPassword } from '@/lib/security';
import { getSharedCustomers } from '@/app/api/customers/route';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, phone, pin, otp, password, email, firstName, lastName, identifier, username } = body;

    // Strict SQL Injection Prevention on all auth fields
    if (
      (phone && hasSqlInjection(String(phone))) ||
      (pin && hasSqlInjection(String(pin))) ||
      (password && hasSqlInjection(String(password))) ||
      (email && hasSqlInjection(String(email))) ||
      (type && hasSqlInjection(String(type))) ||
      (firstName && hasSqlInjection(String(firstName))) ||
      (lastName && hasSqlInjection(String(lastName))) ||
      (identifier && hasSqlInjection(String(identifier))) ||
      (username && hasSqlInjection(String(username)))
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid characters detected (SQL Injection protection).' },
        { status: 400 }
      );
    }

    // Admin Console Login (RBAC-enforced with signed session cookie)
    if (type === 'admin') {
      const adminId = String(identifier || username || email || '').trim().toLowerCase();
      if (!adminId) {
        return NextResponse.json(
          { success: false, message: 'Admin username or email is required' },
          { status: 400 }
        );
      }
      if (!password) {
        return NextResponse.json(
          { success: false, message: 'Password is required' },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdminClient();
      if (supabase) {
        // Query admin_users table in Supabase by username or email
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('id, username, email, full_name, role, password_hash, permissions, is_active')
          .or(`username.ilike.${adminId},email.ilike.${adminId}`)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('[AUTH ERROR] Supabase admin lookup failed:', error.message);
          return NextResponse.json(
            { success: false, message: 'Authentication service temporarily unavailable' },
            { status: 500 }
          );
        }

        if (!adminUser) {
          return NextResponse.json(
            { success: false, message: 'Admin account not recognized.' },
            { status: 401 }
          );
        }

        let isPwdValid = verifyPassword(password, adminUser.password_hash);
        if (!isPwdValid && adminUser.password_hash?.startsWith('$2')) {
          const { data: rpcValid } = await supabase.rpc('verify_user_password', {
            account_type: 'admin',
            identifier: adminId,
            candidate_password: password,
          });
          if (rpcValid === true) {
            isPwdValid = true;
          }
        }

        if (!isPwdValid) {
          return NextResponse.json(
            { success: false, message: 'Invalid admin credentials' },
            { status: 401 }
          );
        }

        const sessionToken = await signSessionToken({
          userId: adminUser.id,
          role: adminUser.role,
          fullName: adminUser.full_name,
          email: adminUser.email,
          branchId: 'all',
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: adminUser.id,
            name: adminUser.full_name,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
            permissions: adminUser.permissions || [],
          },
        });

        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24, // 24 hours
        });

        response.cookies.set({
          name: 'dhobighat_session',
          value: sessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24,
        });

        response.cookies.set({
          name: 'dhobighat_admin_id',
          value: adminUser.id,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24,
        });

        return response;
      }

      // Supabase not configured: Fallback to mock data for offline development & tests
      const matched = initialAdminUsers.find(
        (a) => a.username.toLowerCase() === adminId || a.email.toLowerCase() === adminId
      );

      if (!matched) {
        return NextResponse.json(
          { success: false, message: 'Admin account not recognized.' },
          { status: 401 }
        );
      }

      const isPwdValid = matched.passwordHash
        ? verifyPassword(password, matched.passwordHash)
        : false;

      if (!isPwdValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid admin credentials' },
          { status: 401 }
        );
      }

      const sessionToken = await signSessionToken({
        userId: matched.id,
        role: matched.role,
        fullName: matched.name,
        email: matched.email,
        branchId: 'all',
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: matched.id,
          name: matched.name,
          username: matched.username,
          email: matched.email,
          role: matched.role,
          permissions: matched.permissions,
        },
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      response.cookies.set({
        name: 'dhobighat_session',
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      response.cookies.set({
        name: 'dhobighat_admin_id',
        value: matched.id,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    if (!phone && !email) {
      return NextResponse.json({ success: false, message: 'Phone number or email is required' }, { status: 400 });
    }

    if (type === 'staff') {
      if (!password && !pin) {
        return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 });
      }

      const candidatePassword = password || pin;
      const cleanPhone = sanitizePhoneNumber(phone);
      const supabase = getSupabaseAdminClient();

      if (supabase) {
        // Query store_staff table in Supabase by phone
        let { data: staffMember, error } = await supabase
          .from('store_staff')
          .select('id, full_name, phone, role, password_hash, branch_id, is_active')
          .eq('phone', cleanPhone)
          .eq('is_active', true)
          .maybeSingle();

        if (!staffMember && cleanPhone) {
          const { data: altStaff } = await supabase
            .from('store_staff')
            .select('id, full_name, phone, role, password_hash, branch_id, is_active')
            .ilike('phone', `%${cleanPhone}`)
            .eq('is_active', true)
            .maybeSingle();
          if (altStaff) staffMember = altStaff;
        }

        if (error) {
          console.error('[AUTH ERROR] Supabase staff lookup failed:', error.message);
          return NextResponse.json(
            { success: false, message: 'Authentication service temporarily unavailable' },
            { status: 500 }
          );
        }

        if (!staffMember) {
          return NextResponse.json({ success: false, message: 'Staff phone number not recognized' }, { status: 401 });
        }

        let isPwdValid = verifyPassword(candidatePassword, staffMember.password_hash);
        if (!isPwdValid && staffMember.password_hash?.startsWith('$2')) {
          const { data: rpcValid } = await supabase.rpc('verify_user_password', {
            account_type: 'staff',
            identifier: staffMember.phone,
            candidate_password: candidatePassword,
          });
          if (rpcValid === true) {
            isPwdValid = true;
          }
        }

        if (!isPwdValid) {
          return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        const sessionToken = await signSessionToken({
          userId: staffMember.id,
          role: staffMember.role,
          phone: staffMember.phone,
          fullName: staffMember.full_name,
          branchId: staffMember.branch_id || 'branch-blr-indira',
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: staffMember.id,
            name: staffMember.full_name,
            role: staffMember.role,
            phone: staffMember.phone,
            branchId: staffMember.branch_id || 'branch-blr-indira',
          },
        });

        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;
      }

      // Supabase not configured: Fallback to mock initialStaff for offline development & tests
      const staffMember = initialStaff.find((s) => s.phone === phone);
      if (!staffMember) {
        return NextResponse.json({ success: false, message: 'Staff phone number not recognized' }, { status: 401 });
      }

      const isPinValid = verifyPassword(candidatePassword, staffMember.passwordHash);

      if (!isPinValid) {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
      }

      const sessionToken = await signSessionToken({
        userId: staffMember.id,
        role: staffMember.role,
        phone: staffMember.phone,
        fullName: staffMember.name,
        branchId: 'branch-blr-indira',
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: staffMember.id,
          name: staffMember.name,
          role: staffMember.role,
          phone: staffMember.phone,
          branchId: 'branch-blr-indira',
        },
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    // Customer Login & Account Session (Password-based with verification)
    if (type === 'customer') {
      const cleanPhone = phone ? sanitizePhoneNumber(phone) : '';
      const cleanEmail = email ? String(email).trim().toLowerCase() : '';

      if (!cleanPhone && !cleanEmail) {
        return NextResponse.json({ success: false, message: 'Phone number or email is required.' }, { status: 400 });
      }

      if (!password && !otp) {
        return NextResponse.json(
          { success: false, message: 'Password or authentication token is required.' },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdminClient();
      if (supabase) {
        // Query customers table in Supabase by phone or email
        let customer: any = null;
        if (cleanPhone) {
          const { data: byPhone, error: phoneErr } = await supabase
            .from('customers')
            .select('id, phone, first_name, last_name, email, password_hash, wallet_balance')
            .ilike('phone', `%${cleanPhone}`)
            .maybeSingle();
          if (byPhone) customer = byPhone;
        }

        if (!customer && cleanEmail) {
          const { data: byEmail, error: emailErr } = await supabase
            .from('customers')
            .select('id, phone, first_name, last_name, email, password_hash, wallet_balance')
            .ilike('email', cleanEmail)
            .maybeSingle();
          if (byEmail) customer = byEmail;
        }

        // Verify password for registered accounts
        if (customer && password) {
          let isPwdValid = verifyPassword(password, customer.password_hash);
          if (!isPwdValid && customer.password_hash?.startsWith('$2')) {
            const { data: rpcValid } = await supabase.rpc('verify_user_password', {
              account_type: 'customer',
              identifier: cleanPhone || cleanEmail,
              candidate_password: password,
            });
            if (rpcValid === true) {
              isPwdValid = true;
            }
          }

          if (!isPwdValid) {
            return NextResponse.json({ success: false, message: 'Incorrect customer password.' }, { status: 401 });
          }
        } else if (!customer && !body.isNewSignup && !otp) {
          return NextResponse.json({ success: false, message: 'Customer account not found.' }, { status: 404 });
        }

        let effectiveCustomer = customer;
        if (!effectiveCustomer && body.isNewSignup) {
          const newCustRecord = {
            phone: cleanPhone || '9876543210',
            first_name: firstName || body.name || 'Valued',
            last_name: lastName || 'Customer',
            email: cleanEmail || `${cleanPhone || 'customer'}@dhobighat.in`,
            password_hash: password ? hashPassword(password) : null,
            is_verified: Boolean(otp),
            wallet_balance: 0.00,
          };

          const { data: insertedCustomer } = await supabase
            .from('customers')
            .insert([newCustRecord])
            .select('id, phone, first_name, last_name, email, wallet_balance')
            .maybeSingle();

          if (insertedCustomer) {
            effectiveCustomer = insertedCustomer;
          } else {
            effectiveCustomer = {
              id: body.id || `cust-${Date.now()}`,
              ...newCustRecord,
            };
          }
        }

        if (!effectiveCustomer) {
          effectiveCustomer = {
            id: body.id || `cust-${Date.now()}`,
            phone: cleanPhone || '9876543210',
            first_name: firstName || body.name || 'Valued',
            last_name: lastName || 'Customer',
            email: cleanEmail || `${cleanPhone}@dhobighat.in`,
          };
        }

        const fullName = `${effectiveCustomer.first_name || effectiveCustomer.firstName || ''} ${effectiveCustomer.last_name || effectiveCustomer.lastName || ''}`.trim() || 'Valued Customer';

        const sessionToken = await signSessionToken({
          userId: String(effectiveCustomer.id),
          role: 'customer',
          phone: effectiveCustomer.phone,
          fullName: fullName,
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: effectiveCustomer.id,
            name: fullName,
            role: 'customer',
            phone: effectiveCustomer.phone,
            email: effectiveCustomer.email,
          },
        });

        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      }

      // Supabase not configured: Fallback to mock data for offline development & tests
      const customers = getSharedCustomers();
      const matched = customers.find((c) => {
        const phoneMatch = cleanPhone.length >= 10 && c.phone.replace(/\D/g, '').endsWith(cleanPhone);
        const emailMatch = cleanEmail.length > 0 && c.email.toLowerCase() === cleanEmail;
        return phoneMatch || emailMatch;
      });

      // Verify password for registered accounts
      if (matched && password) {
        const isPwdValid = verifyPassword(password, matched.passwordHash || matched.password);
        if (!isPwdValid) {
          return NextResponse.json({ success: false, message: 'Incorrect customer password.' }, { status: 401 });
        }
      } else if (!matched && !body.isNewSignup && !otp) {
        return NextResponse.json({ success: false, message: 'Customer account not found.' }, { status: 404 });
      }

      const effectiveCustomer = matched || {
        id: body.id || `cust-${Date.now()}`,
        phone: cleanPhone || '9876543210',
        firstName: firstName || body.name || 'Valued',
        lastName: lastName || 'Customer',
        email: cleanEmail || `${cleanPhone}@dhobighat.in`,
      };

      const sessionToken = await signSessionToken({
        userId: effectiveCustomer.id,
        role: 'customer',
        phone: effectiveCustomer.phone,
        fullName: `${effectiveCustomer.firstName} ${effectiveCustomer.lastName}`.trim(),
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: effectiveCustomer.id,
          name: `${effectiveCustomer.firstName} ${effectiveCustomer.lastName}`.trim(),
          role: 'customer',
          phone: effectiveCustomer.phone,
          email: effectiveCustomer.email,
        },
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid login type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
