import React from 'react';

// Using vite-plugin-svgr via '?react' query parameter syntax
import MI from '../../assets/logos/teams/MI.svg?react';
import CSK from '../../assets/logos/teams/CSK.svg?react';
import RCB from '../../assets/logos/teams/RCB.svg?react';
import GT from '../../assets/logos/teams/GT.svg?react';
import LSG from '../../assets/logos/teams/LSG.svg?react';
import KKR from '../../assets/logos/teams/KKR.svg?react';
import DC from '../../assets/logos/teams/DC.svg?react';
import RR from '../../assets/logos/teams/RR.svg?react';
import SRH from '../../assets/logos/teams/SRH.svg?react';
import PBKS from '../../assets/logos/teams/PBKS.svg?react';

const LOGOS = {
  MI, CSK, RCB, GT, LSG, KKR, DC, RR, SRH, PBKS
};

const TeamLogo = ({ teamCode, className }) => {
  if (!teamCode) return null;
  const LogoComponent = LOGOS[teamCode.toUpperCase()];

  if (!LogoComponent) {
    return (
      <div 
        className={className} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '50%', 
          color: '#fff', 
          fontWeight: 'bold',
          fontSize: '0.6rem',
          width: '100%',
          height: '100%'
        }}
        title={`Missing logo for ${teamCode}`}
      >
        {teamCode}
      </div>
    );
  }

  return <LogoComponent className={className} style={{ width: '100%', height: '100%' }} />;
};

export default TeamLogo;
