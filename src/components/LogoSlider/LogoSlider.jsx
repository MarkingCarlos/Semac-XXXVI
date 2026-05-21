import './logoSlider.css';

export default function LogoSlider({ logos }) {
    const track = [...logos, ...logos];

    return (
        <div className="logo-slider">
            <div className="logo-slider-track">
                {track.map((logo, i) => (
                    <div className="logo-slider-item" key={i}>
                        <img src={logo.logo} alt={logo.nome} />
                    </div>
                ))}
            </div>
        </div>
    );
}
