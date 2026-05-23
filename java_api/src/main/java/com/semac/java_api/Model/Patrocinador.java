package com.semac.java_api.model;

import com.semac.java_api.model.enums.NivelPatrocinio;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "patrocinador")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Patrocinador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String nome;

    private String descricao;

    @Column(name = "logo_url")
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_patrocinio", nullable = false)
    private NivelPatrocinio nivelPatrocinio;
}
