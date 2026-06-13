import './logoSlider.css';

export default function LogoSlider({ logos }) {
    const track = [...logos, ...logos];

    return (
        <div className="sliderLogos">
            <div className="trilhaSliderLogos">
                {track.map((logo, i) => (
                    <div className="itemSliderLogos" key={i}>
                        <img src={logo.logo} alt={logo.nome} />
                    </div>
                ))}
            </div>
        </div>
    );
}
