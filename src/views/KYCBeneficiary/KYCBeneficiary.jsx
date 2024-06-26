import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import isEqual from 'lodash/isEqual'

//Import icons
import { ReactComponent as BackIcon } from '../../static/images/arrow.svg'
import DefaultPhoto from '../../static/images/placeholder-profile.jpg'

//Import utils
import { readFile, Moment, getCountry } from '../../utils/constanst'

import {
  identificationType,
  foundsOrigin,
  relationship,
} from '../../utils/values'
import { useSesionStorage } from '../../utils/hooks/useSesionStorage'

//Import components
import ActivityIndicator from '../../components/ActivityIndicator/Activityindicator'
import ModalPhoto from '../../components/ModalPhoto/ModalPhoto'

//Import styles
import '../KYCPerson/KYCStyles.scss'

const KYCBeneficiary = ({ data, onClickChangePage }) => {
  const [loader, setLoader] = useState(false)
  const { token } = useSelector(storage => storage.globalStorage)
  const credentials = {
    headers: {
      'x-auth-token': token,
    },
  }

  const KYC_PERSON_PAGE = 2

  const [showModal, setShowModal] = useState({
    visible: false,
    image: '',
    title: '',
  })

  const KEY = `kyc-beneficiary-${data.identificationNumber}`

  const [beneficiary, setBeneficiary] = useSesionStorage(KEY, {})

  const fetchDetail = async updating => {
    !updating && setLoader(true)

    //Obtener fotos
    const identificationPhoto =
      data.indentificationPictureId &&
      (await readFile(data.indentificationPictureId, credentials))

    const profilePhoto =
      data.profilePictureId &&
      (await readFile(data.profilePictureId, credentials))

    const newBeneficiary = {
      ...data,
      nationality: getCountry(data.nationality),
      countryResidence: getCountry(data.residence),
      identificationPhoto: identificationPhoto
        ? URL.createObjectURL(identificationPhoto)
        : DefaultPhoto,
      profilePhoto: profilePhoto
        ? URL.createObjectURL(profilePhoto)
        : DefaultPhoto,
    }

    console.log(newBeneficiary)

    const beneficiaryNotUpdated = isEqual(newBeneficiary, beneficiary)

    //Si hay diferencias actualizar el estado
    !beneficiaryNotUpdated && setBeneficiary(newBeneficiary)

    setLoader(false)
  }

  useEffect(
    _ => {
      if (data) {
        Object.keys(beneficiary).length === 0
          ? fetchDetail(false)
          : fetchDetail(true)
      }
    },
    [data]
  )

  return (
    <section className="KYCPerson">
      {loader && (
        <div className="center-element">
          <ActivityIndicator size={100} />
        </div>
      )}
      <div className="kyc-header">
        <div className="icon-container">
          <BackIcon
            className="icon"
            fill="#ffffff"
            onClick={() => onClickChangePage(KYC_PERSON_PAGE)}
          />
        </div>

        <h2>Información del beneficiario</h2>
      </div>

      <h1 className="person-name">
        {beneficiary?.firstname} {beneficiary?.lastname}
      </h1>
      <div className="card-container">
        <div className="card">
          <h3 className="card-title">Información personal</h3>
          <div className="card-body three-columns">
            <div className="column image-container">
              {beneficiary.profilePictureId && (
                <img
                  className="card-image"
                  src={beneficiary.profilePhoto}
                  alt="Avatar"
                  onClick={() =>
                    setShowModal({
                      visible: true,
                      image: beneficiary.profilePhoto,
                      title: `${beneficiary.firstname} ${beneficiary?.lastname}`,
                    })
                  }
                />
              )}
            </div>

            <div>
              <div className="label-group">
                <span className="card-label">Correo</span>
                <p className="card-value">{beneficiary?.email}</p>
              </div>
              <div className="label-group">
                <span className="card-label">Número de teléfono </span>
                <p className="card-value">{beneficiary?.principalNumber}</p>
              </div>

              <div className="label-group">
                <span className="card-label">Teléfono alternativo</span>
                <p className="card-value">{beneficiary?.alternativeNumber}</p>
              </div>
            </div>

            <div>
              <div className="label-group">
                <span className="card-label">Parentesco</span>
                <p className="card-value">
                  {relationship[beneficiary?.relationship]}
                </p>
              </div>

              <div className="label-group">
                <span className="card-label">Fecha de nacimiento</span>
                <p className="card-value">
                  <Moment date={beneficiary?.birthday} format="DD-MM-YYYY" />
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Identificación personal</h3>
          <div className="card-body">
            <div className="identity-container">
              <div className="image-container ">
                {beneficiary.indentificationPictureId && (
                  <img
                    onClick={() =>
                      setShowModal({
                        visible: true,
                        image: beneficiary.identificationPhoto,
                        title: beneficiary.identificationNumber,
                      })
                    }
                    className="card-image"
                    src={beneficiary.identificationPhoto}
                    alt="Avatar"
                  />
                )}
              </div>

              <div className="identity">
                <span className="card-label">
                  {beneficiary?.identificationNumber}
                </span>
                <p className="card-value">
                  {identificationType[beneficiary?.identificationType]}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Nacionalidad y residencia</h3>

          <div className="card-body three-columns">
            <div>
              <div className="label-group">
                <span className="card-label">Nacionalidad</span>
                <p className="card-value">{beneficiary.nationality}</p>
              </div>
              <div className="label-group">
                <span className="card-label">País de residencia</span>
                <p className="card-value">{beneficiary.countryResidence}</p>
              </div>
              <div className="label-group">
                <span className="card-label">Estado / Provincia / Región</span>
                <p className="card-value">{beneficiary.province}</p>
              </div>
            </div>

            <div>
              <div className="label-group">
                <span className="card-label">Ciudad</span>
                <p className="card-value">{beneficiary.city}</p>
              </div>
              <div className="label-group">
                <span className="card-label">Dirección (linea 1)</span>
                <p className="card-value">{beneficiary.direction1}</p>
              </div>
            </div>

            <div>
              <div className="label-group">
                <span className="card-label">Código postal</span>
                <p className="card-value">{beneficiary.postalCode}</p>
              </div>

              <div className="label-group">
                <span className="card-label">Dirección (linea 2)</span>
                <p className="card-value">{beneficiary.direction2}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Información de control</h3>

          <div className="card-body">
            <div className="label-group">
              <span className="card-label">Origen de ingresos</span>
              <p className="card-value">
                {foundsOrigin[beneficiary?.foundsOrigin]}
              </p>
            </div>
            <div className="label-group">
              <span className="card-label">Monto estimado al mes</span>
              <p className="card-value">
                USD$ {beneficiary?.estimateMonthlyAmount}
              </p>
            </div>
            <div className="label-group">
              <span className="card-label">Profesión</span>
              <p className="card-value">{beneficiary?.profession}</p>
            </div>
          </div>
        </div>
      </div>

      {showModal.visible && (
        <ModalPhoto
          image={showModal.image}
          title={showModal.title}
          onClose={() => setShowModal({ ...showModal, visible: false })}
        />
      )}
    </section>
  )
}

export default KYCBeneficiary
