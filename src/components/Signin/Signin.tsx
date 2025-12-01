'use client';

import { LoginForm } from '@/components/LoginForm';
import { Link } from '@/components/NextLink';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { Facebook, Google, Twitter } from '@mui/icons-material';
import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import Image from 'next/image';
import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';

export const Signin = () => {
  const dictionary = useDictionary();
  const lang = useLanguage();

  return (
    <Box
      sx={{
        width: { xs: '100%'},
        minHeight: '100vh',
        margin: '0',
        p: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f7fb',
        overflowX: 'hidden',
      }}
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          borderRadius: { xs: '24px', md: '32px' },
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          maxWidth: 720,
          width: '100%',
          mx: 'auto',
        }}
      >
        {/* Left Hero Section with Curves */}
        <CardContent
          sx={{
            flex: { xs: '0 1 220px', md: '0 1 320px' },
            position: 'relative',
            background: `linear-gradient(135deg, #0267a0 0%, #00a8ff 100%)`,
            color: 'common.white',
            p: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            // Curve for mobile (bottom edge)
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: { xs: '-20px', md: 'auto' },
              right: { xs: 0, md: 'auto' },
              width: { xs: '100%', md: '40px' },
              height: { xs: '40px', md: '100%' },
              background: 'inherit',
              clipPath: {
                xs: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)',
                md: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
              },
              zIndex: 1,
            },
            // Main curve for desktop (right edge)
            clipPath: {
              xs: 'none',
              md: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
            },
          }}
        >
          <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            color: 'common.white',
            position: 'relative',
            zIndex: 2,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Header Section - Centered at top */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Typography
              variant={'h4'}
              color={'inherit'}
              fontWeight={600}
              sx={{
                fontSize: { 
                  xs: '1.75rem',
                  sm: '2rem', 
                  md: '2.5rem',
                  lg: '3rem'
                },
                lineHeight: 1.2,
                textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
                mb: 2,
              }}
            >
              {dictionary.signin.header}
            </Typography>
          </Box>

          {/* Logo Section - Centered below header */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Link 
              underline='none' 
              href='#' 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                height={50}
                width={150}
                src={`${ASSET_IMAGES}/logos/proserp-white.png`}
                alt='ProsERP'
                style={{
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              />
            </Link>
          </Box>
        </Box>
        </CardContent>

        {/* Right Form Section with Matching Curves */}
       <CardContent 
          sx={{ 
            flex: 1, 
            p: { xs: 3, md: 4 },
            background: 'white',
            position: 'relative',
            zIndex: 5, // Higher z-index
            // Simplify clipPath or remove it
            clipPath: {
              xs: 'none', // Disable on mobile completely
              md: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' // Less aggressive curve
            },
            // Remove negative margin
            marginLeft: 0,
            overflow: 'visible !important',
            // Ensure content area is properly positioned
            '& > div': {
              position: 'relative',
              zIndex: 6,
              backgroundColor: 'white',
              padding: { xs: 2, md: 0 },
              borderRadius: '8px',
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 3 }}>
            <LoginForm />
            
            {/* Additional Links */}
            <Box sx={{ mt: 3 }}>
              <Typography variant={'body1'} mb={2} align='center'>
                <Link 
                  underline='none' 
                  href={`/${lang}/auth/reset-password`}
                  sx={{ 
                    color: '#0267a0',
                  }}
                >
                  {dictionary.signin.forgotPassword.text}
                </Link>
              </Typography>
              
              <Typography variant={'body1'} mb={3} align='center'>
                <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                  {dictionary.signin.accountPrompt.text}
                </Box>
                <Link 
                  underline='none' 
                  href={`/${lang}/auth/signup`}
                  sx={{ 
                    color: '#0267a0',
                    fontWeight: 600,
                    '&:hover': { color: '#00a8ff' }
                  }}
                >
                  {dictionary.signin.accountPrompt.action}
                </Link>
              </Typography>

              {/* Social Login Section */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant={'body2'} 
                  mb={2}
                  sx={{ 
                    color: 'text.secondary',
                    position: 'relative',
                    '&::before, &::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      width: '30%',
                      height: '1px',
                      backgroundColor: 'divider',
                    },
                    '&::before': { left: 0 },
                    '&::after': { right: 0 },
                  }}
                >
                  {dictionary.signin.socialLogin.prefix}
                </Typography>
                
                <Stack direction='row' justifyContent='center' alignItems='center' spacing={2} mb={1}>
                  <IconButton
                    sx={{
                      bgcolor: '#385196',
                      color: 'common.white',
                      p: 1.5,
                      '&:hover': {
                        backgroundColor: '#2d4373',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={`${dictionary.signin.socialLogin.prefix} ${dictionary.signin.socialLogin.options.facebook}`}
                  >
                    <Facebook fontSize='small' />
                  </IconButton>
                  <IconButton
                    sx={{
                      bgcolor: '#00a8ff',
                      color: 'common.white',
                      p: 1.5,
                      '&:hover': {
                        backgroundColor: '#0095e0',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={`${dictionary.signin.socialLogin.prefix} ${dictionary.signin.socialLogin.options.twitter}`}
                  >
                    <Twitter fontSize='small' />
                  </IconButton>
                  <IconButton
                    sx={{
                      bgcolor: '#23272b',
                      color: 'common.white',
                      p: 1.5,
                      '&:hover': {
                        backgroundColor: '#1a1e21',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={`${dictionary.signin.socialLogin.prefix} ${dictionary.signin.socialLogin.options.google}`}
                  >
                    <Google fontSize='small' />
                  </IconButton>
                </Stack>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};